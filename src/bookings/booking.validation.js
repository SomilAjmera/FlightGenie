const Joi = require('joi');

const createBooking = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        mobileNumber: Joi.string().required()
    }),
    params: Joi.object().keys({
        flightCode: Joi.string().required()
    })
};

module.exports = {
    createBooking
};
