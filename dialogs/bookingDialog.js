const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');
const flightController = require('../src/flights/flight.controller');
const { getAvailableFlightsSchema } = require('../src/flights/flight.validation');
const { createBooking } = require('../src/bookings/booking.validation');
const bookingController = require('../src/bookings/booking.controller');
const paymentController = require('../src/payments/payment.controller');
const paymentValidation = require('../src/payments/payment.validation');
const { initPayment } = require('../src/payments/payment.validation');
const paymentService = require('../src/payments/payment.service');


const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class BookingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'bookingDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.destinationStep.bind(this),
                this.originStep.bind(this),
                this.numberOfTravelersStep.bind(this),
                this.travelDateStep.bind(this), 
                this.flightSearchStep.bind(this),
                this.flightSelectionStep.bind(this), // New step for flight selection
                this.confirmStep.bind(this),
                this.emailStep.bind(this), // New step for collecting email
                this.firstNameStep.bind(this), // New step for collecting first name
                this.lastNameStep.bind(this), // New step for collecting last name
                this.mobileNumberStep.bind(this), // New step for collecting mobile number
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async destinationStep(stepContext) {
        const bookingDetails = stepContext.options;

        if (!bookingDetails.destination) {
            const messageText = 'To what city would you like to travel?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(bookingDetails.destination);
    }

    async originStep(stepContext) {
        const bookingDetails = stepContext.options;

        bookingDetails.destination = stepContext.result;
        if (!bookingDetails.origin) {
            const messageText = 'From what city will you be travelling?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(bookingDetails.origin);
    }
    
    async numberOfTravelersStep(stepContext) {
        const bookingDetails = stepContext.options;
        bookingDetails.origin = stepContext.result;

        const messageText = 'How many travelers will be on this booking?';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async travelDateStep(stepContext) {
        const bookingDetails = stepContext.options;
        bookingDetails.numberOfTravelers = stepContext.result;
        
        if (!bookingDetails.travelDate || this.isAmbiguous(bookingDetails.travelDate)) {
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: bookingDetails.travelDate });
        }
        return await stepContext.next(bookingDetails.travelDate);
    }

    async flightSearchStep(stepContext) {
        const bookingDetails = stepContext.options;
        bookingDetails.travelDate = stepContext.result;
    
        try {
            const flights = await flightController.getAvailableFlightsDirect({
                origin: bookingDetails.origin,
                destination: bookingDetails.destination,
                travelDate: bookingDetails.travelDate,
                travelers: bookingDetails.numberOfTravelers
            });
    
            if (flights.length === 0) {
                const messageText = 'No flights available for the selected criteria. Please try again with different details.';
                const msg = MessageFactory.text(messageText, messageText, InputHints.IgnoringInput);
                await stepContext.context.sendActivity(msg);
                return await stepContext.endDialog();
            }
    
            // Store flights in bookingDetails for the next step
            bookingDetails.flights = flights;
            
            let options = '';
            flights.forEach((flight, index) => {
                const price = parseFloat(flight.price.total).toFixed(2);
                const currency = flight.price.currency;
                const airlineCode = flight.validatingAirlineCodes[0];
                const lastTicketingDateTime = flight.lastTicketingDateTime;
                const seatsleft = flight.numberOfBookableSeats;
    
                options += `${index + 1}. ${airlineCode} - ${currency} ${price}\n`;
                options += `    Last Ticketing Date: ${lastTicketingDateTime}\n\n`;
                options += `    Seats Left: ${seatsleft}\n\n`;
            });
            options += 'Please select a flight option by typing its number.';
    
            const messageText = 'Here are some flight options:\n';
            const msg = MessageFactory.text(messageText + options, messageText + options, InputHints.ExpectingInput);
    
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        } catch (error) {
            console.error('Error fetching flights:', error);
            const messageText = 'An error occurred while fetching flights. Please try again later.';
            const msg = MessageFactory.text(messageText, messageText, InputHints.IgnoringInput);
            await stepContext.context.sendActivity(msg);
            return await stepContext.endDialog();
        }
    }
    

    async flightSelectionStep(stepContext) {
        const bookingDetails = stepContext.options;

        const selectedFlightIndex = parseInt(stepContext.result) - 1;

        if (selectedFlightIndex >= 0 && selectedFlightIndex < bookingDetails.flights.length) {
            bookingDetails.selectedFlight = bookingDetails.flights[selectedFlightIndex];
            return await stepContext.next(); // Proceed to the next step in the waterfall dialog
        } else {
            const invalidMessageText = 'Invalid selection. Please select a valid flight option.';
            const invalidMsg = MessageFactory.text(invalidMessageText, invalidMessageText, InputHints.IgnoringInput);
            await stepContext.context.sendActivity(invalidMsg);
            return await stepContext.replaceDialog(WATERFALL_DIALOG); // Restart the waterfall dialog
        }
    }

    async confirmStep(stepContext) {
        const bookingDetails = stepContext.options;
        // console.log(bookingDetails.selectedFlight);
        const messageText = `Please confirm, Do you want to Book ticket for ${bookingDetails.numberOfTravelers} members from ${ bookingDetails.origin } to ${ bookingDetails.destination } on ${ bookingDetails.travelDate } with the following flight:\n`;
        const selectedFlightInfo = `${ bookingDetails.selectedFlight.validatingAirlineCodes[0] } - ${bookingDetails.selectedFlight.price.total} ${ bookingDetails.selectedFlight.price.currency } - It's Last Ticketing Date is - ${ bookingDetails.selectedFlight.lastTicketingDateTime} - Remenber Seats Left = ${bookingDetails.selectedFlight.numberOfBookableSeats} - Total Amount ${bookingDetails.numberOfTravelers*bookingDetails.selectedFlight.price.total}`;
        const msg = MessageFactory.text(messageText + selectedFlightInfo, messageText + selectedFlightInfo, InputHints.ExpectingInput);

        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    async emailStep(stepContext) {
        if (stepContext.result) {
            // const bookingDetails = stepContext.options;

            const messageText = 'Please provide your email address.';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.endDialog();
    }

    async firstNameStep(stepContext) {
        const bookingDetails = stepContext.options;
        bookingDetails.email = stepContext.result;

        const messageText = 'Please provide your first name.';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async lastNameStep(stepContext) {
        const bookingDetails = stepContext.options;
        bookingDetails.firstName = stepContext.result;

        const messageText = 'Please provide your last name.';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async mobileNumberStep(stepContext) {
        const bookingDetails = stepContext.options;
        bookingDetails.lastName = stepContext.result;

        const messageText = 'Please provide your mobile number.';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async finalStep(stepContext) {
        const bookingDetails = stepContext.options;
        bookingDetails.mobileNumber = stepContext.result;
    
        // Validate booking details
        const { error, value } = createBooking.body.validate({
            email: bookingDetails.email,
            firstName: bookingDetails.firstName,
            lastName: bookingDetails.lastName,
            mobileNumber: bookingDetails.mobileNumber
        });
        // console.log(value);
    
        const paramValidation = createBooking.params.validate({
            flightCode: bookingDetails.selectedFlight.validatingAirlineCodes[0]
        });
    
        if (error || paramValidation.error) {
            const messageText = 'There was an error with your booking details. Please try again.';
            const msg = MessageFactory.text(messageText, messageText, InputHints.IgnoringInput);
            await stepContext.context.sendActivity(msg);
            return await stepContext.endDialog();
        }
    
        // Create booking
        try {
            const booking = await bookingController.createBookingDirect({
                email: bookingDetails.email,
                firstName: bookingDetails.firstName,
                lastName: bookingDetails.lastName,
                mobileNumber: bookingDetails.mobileNumber,
                flightCode: bookingDetails.selectedFlight.validatingAirlineCodes[0],
                price : bookingDetails.selectedFlight.price.total,
                origin: bookingDetails.origin,
                destination: bookingDetails.destination,
                travellers:bookingDetails.numberOfTravelers,
                travelDate: bookingDetails.travelDate,
                conversationId: stepContext.context.activity.conversation.id,
                serviceUrl: stepContext.context.activity.serviceUrl,
                userId: stepContext.context.activity.from.id,

                // Add other necessary booking details here
            });
            // console.log(booking.id);
            const bookingId = booking.id;
            const confirmationMsg = `Your flight Booking ID is : ${ bookingId }`;
            await stepContext.context.sendActivity(confirmationMsg);
    
            const { error: paymentError, value: paymentValue } = initPayment.params.validate({
                bookingId: bookingId,
                // Add other payment-related parameters here
            });
    
            if (paymentError) {
                throw new Error('Payment validation failed.');
            }
            // console.log("ok");
    
            const paymentResponse = await paymentService.initPayment(bookingId, 
                stepContext.context.activity.conversation.id,
                stepContext.context.activity.serviceUrl,
                stepContext.context.activity.from.id
                // Add other necessary parameters for payment initiation
            );
    
            if (!paymentResponse || !paymentResponse.authorization_url) {
                throw new Error('Payment initialization failed.');
            }
    
            stepContext.options.bookingId = bookingId;
            stepContext.options.conversationId = stepContext.context.activity.conversation.id;
            stepContext.options.serviceUrl = stepContext.context.activity.serviceUrl;
            stepContext.options.userId = stepContext.context.activity.from.id;
    
            await stepContext.context.sendActivity(`Please complete your payment using the following link: ${paymentResponse.authorization_url}`);
            await stepContext.context.sendActivity(`After Successful Payment Receipt and Booking Confirmation Email will be sent to your provided Email`);

    
            return await stepContext.endDialog();
        } catch (error) {
            console.error('Error creating booking:', error);
            const messageText = 'An error occurred while creating your booking. Please try again later.';
            const msg = MessageFactory.text(messageText, messageText, InputHints.IgnoringInput);
            await stepContext.context.sendActivity(msg);
            return await stepContext.endDialog();
        }
    }
    

    isAmbiguous(timex) {
        const timexProperty = new TimexProperty(timex);
        return !timexProperty.types.has('definite');
    }
}

module.exports.BookingDialog = BookingDialog;