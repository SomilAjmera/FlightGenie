const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { initPaymentSchema } = require('../validations/payment.validation');

// Route for initiating payment
router.post('/:bookingId',
    validate(initPaymentSchema),
    async (req, res, next) => {
        try {
            // Call your payment service to initiate payment
            const paymentResponse = await paymentController.initPaymentDirect(req.params.bookingId, req.body);
            
            // Assuming paymentResponse contains necessary details including authorization URL
            res.json(paymentResponse); // Send payment response back to the client
        } catch (error) {
            console.error('Error initiating payment:', error);
            res.status(500).json({ error: 'Error initiating payment' });
        }
    }
);

// Route for handling Paystack webhook callback
router.post('/paystack/callback',
    async (req, res, next) => {
        try {
            // Handle Paystack webhook callback
            await paymentController.handlePaystackWebhook(req.body);
            
            // Respond to Paystack with 200 OK
            res.status(200).send({ status: 'success' });
        } catch (error) {
            console.error('Error handling Paystack webhook:', error);
            res.status(500).json({ error: 'Error handling Paystack webhook' });
        }
    }
);

module.exports = router;
