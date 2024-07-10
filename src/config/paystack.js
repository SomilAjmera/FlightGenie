const axios = require('axios');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const config = require('./config');
const logger = require('./logger');

const secretKey = config.paystackSecret;

const paystackApi = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: { authorization: `Bearer ${secretKey}` }
});

const initializePayment = async (paymentBody) => {
    const payload = {
        ...paymentBody,
        amount: Math.round(paymentBody.amount * 100) // Convert amount to kobo
    };

    try {
        const res = await paystackApi.post('/transaction/initialize', payload);
          
        // console.log(res);
        const { status, data } = res;
        if (!status || !data.status) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to initialize payment');
        }

        const {
            authorization_url,
            reference
        } = data.data;

        const response = { status: data.status, authorization_url, reference };

        return response;
    } catch (error) {
        logger.error(error);
        throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'An error occurred while initializing payment');
    }
};

const verifyPayment = async (paymentReference) => {
    try {
        const res = await paystackApi.get(`/transaction/verify/${paymentReference}`);

        const { data } = res;
        if (!data.status) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to verify payment');
        }

        const {
            amount,
            status,
            gateway_response,
            reference,
            customer: { email }
        } = data.data;

        const response = { amount, status, gateway_response, reference, email };

        return response;
    } catch (error) {
        logger.error(error);
        throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'An error occurred while verifying payment');
    }
};

module.exports = { initializePayment, verifyPayment };
