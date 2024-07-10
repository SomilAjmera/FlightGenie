const httpStatus = require('http-status');
const paymentService = require('./payment.service');
const catchAsync = require('../utils/catchAsync');
const nodemailer = require('nodemailer');
require('dotenv').config();
const pool = require('../config/db.config');
const ApiError = require('../utils/ApiError');

const initPayment = catchAsync(async (req, res) => {
    const { bookingId, conversationId, serviceUrl, userId } = req.body;
    const payment = await paymentService.initPayment(bookingId, conversationId, serviceUrl, userId);
    res.status(httpStatus.CREATED).send(payment);
});

const initPaymentDirect = async (bookingId, conversationId, serviceUrl, userId) => {
    const payment = await paymentService.initPayment(bookingId, conversationId, serviceUrl, userId);
    return payment;
};

const paystackCallback = catchAsync(async (req, res) => {
    const payment = await paymentService.paystackCallback(req.query.reference);
    res.status(httpStatus.OK).send(payment);
});

const webhook = catchAsync(async (req, res) => {
    const connection = await pool.getConnection();
    // console.log('Received webhook:', req.body);
    const eventData = req.body;
    //console.log("this is event data");
    //console.log(eventData);

    if (eventData.event === 'charge.success') {
        const eventId = eventData.data.id;
        const paymentReference = eventData.data.reference;
        try {
            // Check if event ID is already processed
            const [rows] = await connection.execute('SELECT id FROM processed_events WHERE id = ?', [eventId]);
            if (rows.length > 0) {
                // console.log('Event already processed:', eventId);
                if (!res.headersSent) {
                    return res.status(httpStatus.OK).send('Event already processed');
                }

                return;
            }
            // console.log('Processing payment reference:', paymentReference);
            const payment = await paymentService.paystackCallback(paymentReference);
            // console.log('Payment details:', payment);

            if (payment.status === 'success') {
                // Send booking confirmation email if not already sent
                const emailSent = await isEmailSent(payment.booking);
                if (emailSent !== 1) { // Check if emailSent is not 1
                    await sendBookingEmail(payment.booking);
                } else {
                    console.log('Email already sent for booking ID:', payment.booking);
                }
                
                // Log event ID as processed
                await connection.execute('INSERT INTO processed_events (id) VALUES (?)', [eventId]);

                if (!res.headersSent) {
                    // console.log("done");
                    return res.status(200).send('Webhook received and processed successfully');
                }
                
            } else {
                console.log('Payment status not successful');
                if (!res.headersSent) {
                    return res.status(httpStatus.BAD_REQUEST).send('Payment status not successful');
                }
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            if (!res.headersSent) {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send('Error verifying payment');
            }
        }
    } else {
        if (!res.headersSent) {
            return res.status(httpStatus.BAD_REQUEST).send('Invalid event type');
        }
    }
});

// Function to check if email has already been sent
async function isEmailSent(bookingId) {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT emailSent FROM bookings WHERE id = ?', [bookingId]);
        return rows[0]?.emailSent === 1; // Check if emailSent is 1
    } catch (error) {
        console.error('Error checking email sent status:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to check email sent status');
    } finally {
        connection.release();
    }
}

// Function to send booking confirmation email
async function sendBookingEmail(bookingId) {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        const bookingDetails = rows[0];

        if (!bookingDetails) {
            throw new Error('Booking not found');
        }

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: bookingDetails.email,
            subject: 'Your Flight Booking Confirmation',
            text: `Dear ${bookingDetails.firstName} ${bookingDetails.lastName},\n\n`
                + `Thank you for booking your flight with us. Below are the details of your booking:\n\n`
                + `Booking ID: ${bookingDetails.id}\n`
                + `Flight Code: ${bookingDetails.flightCode}\n`
                + `Price: ${bookingDetails.price}\n`
                + `Total Amount: ${bookingDetails.price*bookingDetails.travellers}\n`
                + `Origin: ${bookingDetails.origin}\n`
                + `Destination: ${bookingDetails.destination}\n`
                + `Number of travellers : ${bookingDetails.travellers}\n`
                + `Travel Date: ${bookingDetails.travelDate}\n\n`
                + `We look forward to welcoming you aboard!\n\n`
                + `Best regards,\n`
                + `Your Airline Team`
        };

        await transporter.sendMail(mailOptions);

        // Mark email as sent in the database
        await connection.execute('UPDATE bookings SET emailSent = ? WHERE id = ?', [1, bookingId]);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send booking email');
    } finally {
        connection.release();
    }
}

module.exports = {
    initPayment,
    initPaymentDirect,
    paystackCallback,
    webhook
};
