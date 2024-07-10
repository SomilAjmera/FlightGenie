const Joi = require('joi');
const moment = require('moment');

const getAvailableFlightsSchema = Joi.object({
    departure: Joi.string().required(),
    destination: Joi.string().required(),
    date: Joi.date()
        .iso()
        .greater(moment().subtract(1, 'day'))
        .required()
        .messages({
            'date.format': 'Date must be in the format yyyy-mm-dd, e.g. 2023-08-20',
            'date.greater': 'Date can\'t be less than today'
        })
});

module.exports = {
    getAvailableFlightsSchema
};
