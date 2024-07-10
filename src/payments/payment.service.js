const { v4: uuidv4 } = require('uuid');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { initializePayment, verifyPayment } = require('../config/paystack');
const pool = require('../config/db.config');

const initPayment = async (bookingId, conversationId, serviceUrl, userId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        const existingBooking = rows[0];
        
        if (!existingBooking) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
        }

        if (existingBooking.status === 'PAID') {
            throw new ApiError(httpStatus.CONFLICT, 'Booking has already been paid for, thanks.');
        }
          // console.log(existingBooking);
          const sum_amount=existingBooking.price*existingBooking.travellers
        const paymentResponse = await initializePayment({
            email: existingBooking.email,
            amount: sum_amount
        });

        paymentResponse.amount = sum_amount;
        paymentResponse.email = existingBooking.email;
        paymentResponse.booking = bookingId;
        paymentResponse.conversationId = conversationId;
        paymentResponse.serviceUrl = serviceUrl;
        paymentResponse.userId = userId;
        
        //console.log('hey!!');
       // const newPaymentId = uuidv4();
        // const newPayment = {
        //     ...paymentResponse,
        //     id: newPaymentId
        // };

        await connection.execute(`
            INSERT INTO payments (reference, booking, email, status, amount, authorization_url, conversationId, serviceUrl, userId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
        `, [
            paymentResponse.reference, bookingId, existingBooking.email, 'PENDING', existingBooking.price*existingBooking.travellers , paymentResponse.authorization_url, conversationId, serviceUrl, userId
        ]);

        return paymentResponse;
    } catch (error) {
        console.error('Error initializing payment:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to initialize payment');
    } finally {
        connection.release();
    }
};

const paystackCallback = async (reference) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM payments WHERE reference = ?', [reference]);
        const existingPayment = rows[0];

        if (!existingPayment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
        }

        const paymentDetails = await verifyPayment(reference);
        const status = paymentDetails.status;

        await connection.execute('UPDATE payments SET status = ? WHERE reference = ?', ['PAID', reference]);

        if (status === 'success') {
            await connection.execute('UPDATE bookings SET status = ? WHERE id = ?', ['PAID', existingPayment.booking]);
        }
        const booking =existingPayment.booking
        return { status, reference, booking };
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to verify payment');
    } finally {
        connection.release();
    }
};

module.exports = {
    initPayment,
    paystackCallback
};
