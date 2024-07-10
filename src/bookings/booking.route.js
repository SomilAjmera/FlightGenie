const express = require('express');
const validate = require('../middleware/validate');
const router = express.Router();
const bookingController = require('./booking.controller');
const bookingValidation = require('./booking.validation');

router
    .route('/:flightCode')
    .post(
        validate(bookingValidation.createBooking),
        bookingController.createBooking
    );

router.route('/').get(bookingController.getAllBookings);

module.exports = router;
