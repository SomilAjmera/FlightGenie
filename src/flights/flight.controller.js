const flightService = require('./flight.service');
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const getAvailableFlights = catchAsync(async (req, res) => {
    const availableFlights = await flightService.getAvailableFlights(req.query);
    res.status(httpStatus.OK).json(availableFlights);
});

const getAvailableFlightsDirect = async (query) => {
    return await flightService.getAvailableFlights(query);
};

const getAllFlights = catchAsync(async (req, res) => {
    const allFlights = await flightService.getAllFlights();
    res.status(httpStatus.OK).json(allFlights);
});

module.exports = {
    getAvailableFlights,
    getAvailableFlightsDirect,
    getAllFlights
};
