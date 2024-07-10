const Joi = require('joi');

const initPayment = {
    params: Joi.object().keys({
        bookingId: Joi.string().required()
    })
};

const verifyPayment = {
    query: Joi.object().keys({
        reference: Joi.string().required(),
        trxref: Joi.string()
    })
};

module.exports = {
    initPayment,
    verifyPayment
};
