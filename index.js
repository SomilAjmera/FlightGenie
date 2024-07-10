// Import required packages
const path = require('path');
const restify = require('restify');
const ngrok = require('ngrok');

// Import bot and dialog setup
const {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    ConversationState,
    createBotFrameworkAuthenticationFromConfiguration,
    InputHints,
    MemoryStorage,
    UserState
} = require('botbuilder');
const { FlightBookingRecognizer } = require('./recognizer/flightBookingRecognizer');
const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');
const { BookingDialog } = require('./dialogs/bookingDialog');
const { webhook } = require('./src/payments/payment.controller'); // Webhook handler

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Setup bot credentials and authentication
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});
const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors
const onTurnErrorHandler = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    await context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    await context.sendActivity('The bot encountered an error or bug.', null, InputHints.ExpectingInput);
    await conversationState.delete(context);
};
adapter.onTurnError = onTurnErrorHandler;

// Define state storage
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Setup dialogs and bot
const cluConfig = {
    endpointKey: process.env.CluAPIKey,
    endpoint: `https://${process.env.CluAPIHostName}`,
    projectName: process.env.CluProjectName,
    deploymentName: process.env.CluDeploymentName
};
const cluRecognizer = new FlightBookingRecognizer(cluConfig);
const bookingDialog = new BookingDialog('bookingDialog');
const dialog = new MainDialog(cluRecognizer, bookingDialog);
const bot = new DialogAndWelcomeBot(conversationState, userState, dialog);

// Create HTTP server with Restify
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.PORT || 3978, async () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');

    try {
        const url = await ngrok.connect({
            addr: process.env.PORT || 3978, // Port where your application is running
            authtoken: process.env.NGROK_AUTH_TOKEN, // Optional: if you have an ngrok auth token
            region: 'us' // Optional: your preferred ngrok region
        });
        console.log(`ngrok tunnel running at: ${url}`);
        console.log(`Webhook URL: ${url}/api/payments/webhook`);
    } catch (error) {
        console.error('Error while setting up ngrok tunnel:', error);
    }
});

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context) => bot.run(context));
});

// Add webhook endpoint for Paystack
server.post('/api/payments/webhook', async (req, res) => {
    try {
       await webhook(req, res);

       if (!res.headersSent) {
        // console.log("done");
        return res.send(200, 'Webhook received and processed successfully');
       }


    } catch (error) {
        console.error('Error handling webhook:', error);

        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            return res.send(500, 'Error handling webhook');
        }
    }
});
