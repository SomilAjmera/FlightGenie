const bookingService = require('./booking.service');
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const createBooking = catchAsync(async (req, res) => {
    const booking = await bookingService.createBooking(req.body);
    res.status(httpStatus.CREATED).send(booking);
});

const createBookingDirect = async (query) => {
    return await bookingService.createBooking(query);
};

const getAllBookings = catchAsync(async (req, res) => {
    const bookings = await bookingService.getAllBookings();
    res.status(httpStatus.OK).send(bookings);
});

module.exports = {
    createBooking,
    createBookingDirect,
    getAllBookings
};
