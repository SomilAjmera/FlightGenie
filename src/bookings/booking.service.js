const { v4: uuidv4 } = require('uuid');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const pool = require('../config/db.config');

const createBooking = async (reqBody) => {
    reqBody.status = 'UNPAID';
    const newBookingId = uuidv4();

    const {
        firstName, lastName, flightCode, price, origin, destination,travellers, travelDate,
        mobileNumber, conversationId, serviceUrl, userId, email, status
    } = reqBody;

    const newBooking = {
        ...reqBody,
        id: newBookingId
    };

    const query = `
        INSERT INTO bookings (id, firstName, lastName, flightCode, price, origin, destination,travellers, travelDate,
        mobileNumber, conversationId, serviceUrl, userId, email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

    try {
        const [result] = await pool.execute(query, [
            newBookingId, firstName, lastName, flightCode, price, origin, destination, travellers, travelDate,
            mobileNumber, conversationId, serviceUrl, userId, email, status
        ]);
    } catch (error) {
        console.error('Error saving booking data to database:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save booking data');
    }

    return newBooking;
};

module.exports = {
    createBooking
};
