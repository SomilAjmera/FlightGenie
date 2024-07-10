### Project Overview: FlightGenie

The Flight Booking Bot with CLU is a sophisticated chatbot built using the Microsoft Bot Framework and CLU (Conversational Language Understanding). This bot aims to streamline the flight booking process by leveraging AI capabilities to interact with users, retrieve real-time flight data, and facilitate secure payment transactions.

## Key Features:

# Natural Language Understanding:

Utilizes CLU to comprehend user queries and intents in multiple languages, enhancing the bot's ability to engage with a diverse user base.

# Real-Time Flight Data Integration:

Integrates with the Amadeus API to fetch and display up-to-date flight information, including availability, pricing, and schedules.

# Secure Payment Processing:

Implements payment processing using the Paystack API, ensuring seamless and secure transactions for booking flights.

# Interactive Dialogues:

Implements multi-turn dialogues to guide users through the booking process, validate user inputs, and provide real-time updates.

# Scalability and Extendability:

Designed with scalability in mind, allowing for future enhancements such as multilingual support, additional travel services integration (like hotel bookings), and personalized recommendations based on user preferences.

This bot aims to revolutionize the travel booking experience by combining advanced AI technologies with reliable data sources, offering users a convenient and efficient way to plan and book their flights.

# CoreBot With CLU for JavaScript

Bot Framework v4 core bot sample using the CLU Recognizer.

This bot has been created using [Bot Framework](https://dev.botframework.com); it shows how to:

- Use [CLU][CLU_ServiceDocHomepage] to implement core AI capabilities
- Implement a multi-turn conversation using Dialogs
- Prompt for and validate requests for information from the user

## Prerequisites

This sample **requires** prerequisites in order to run.

### Overview

This bot uses [Conversational Language Understanding (CLU)][CLU_ServiceDocHomepage], an AI based cognitive service, to implement language understanding. The service uses natively multilingual models, which means that users would be able to train their models in one language but predict in others. Users of the service have access to the [language studio][languagestudio], which simplifies the process of adding/importing data, labelling it, training a model, and then finally evaluating it. For more information, visit the official [service docs][CLU_ServiceDocHomepage].

### Install NodeJS

- [Node.js](https://nodejs.org) version 10.14.1 or higher

  ```bash
  # determine node version
  node --version
  ```

### Create a Conversational Language Understanding Application

The CLU model for this example can be found under `cognitiveModels/FlightBooking.json` and the CLU language model setup, training, and application configuration steps can be found [here](https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/conversational-language-understanding/tutorials/bot-framework).

Once you created the CLU model, update `.env` with your `CluProjectName`, `CluDeploymentName`, `CluAPIKey` and `CluAPIHostName` . Refer sample.env for all the necessary configurations.

```text
CluProjectName="Your CLU project name"
CluDeploymentName="Your CLU deployment name"
CluAPIKey="Your CLU Subscription key here"
CluAPIHostName="Your CLU App region here (i.e: westus.api.cognitive.microsoft.com)"
```

### Additional Configuration

# Paystack configuration:

```text
PAYSTACK_SECRET=your_paystack_secret_key
```

# Amadeus API configuration:

```text
AMADEUS_CLIENT_ID=your_amadeus_api_key
AMADEUS_CLIENT_SECRET=your_amadeus_api_secret
```

# NGROK configuration:

```text
NGROK_AUTH_TOKEN=your_ngrok_auth_token
```

# Nodemailer configuration:

```text
GMAIL_USER=your_gmail_user
GMAIL_PASS=your_gmail_password
```

# Microsoft Bot Framework configuration:

```text
MicrosoftAppId=your_microsoft_app_id
MicrosoftAppPassword=your_microsoft_app_password
MicrosoftAppType=your_microsoft_app_type
MicrosoftAppTenantId=your_microsoft_app_tenantId
```

# Database configuration:

```text
DB_HOST=localhost
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name
```

# Other configurations:

```text
NODE_ENV=development
PORT=3978
```

# To run the bot

Navigate to the directory containing this readme file and perform the following:

- Install modules

  ```bash
  npm install
  ```

- Setup CLU

The prerequisite outlined above contain the steps necessary to provision a conversational language understanding model.

- Start the bot

  ```bash
  npm start
  ```

## Functionalities

# Flight Booking:

Users can search and book flights by providing details like origin, destination, and travel date.
The bot fetches real-time flight data from the Amadeus API.

# Payment Processing:

The bot processes payments using the Paystack API.
Secure transactions are ensured, and users receive instant confirmation via webhooks.

# NGROK Integration:

NGROK is used to expose the bot to the internet, allowing external access for testing and deployment.

## Testing the bot using Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.9.0 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

### Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`

### How to Chat with the Bot

# Launch the Bot Framework Emulator:

Open the Bot Framework Emulator on your local machine.

# Connect to the Bot:

Use the endpoint http://localhost:3978/api/messages to connect to the bot.

# Start Chatting:

You can start chatting with the bot by providing your flight details such as origin, destination, and travel date.
The bot will fetch available flights, and you can proceed to book a flight.
After booking, you will be prompted to make a payment using Paystack.

## Further reading

- [Bot Framework Documentation](https://docs.botframework.com)
- [Bot Basics](https://docs.microsoft.com/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0)
- [Dialogs](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0)
- [Gathering Input Using Prompts](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-prompts?view=azure-bot-service-4.0)
- [Activity processing](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-activity-processing?view=azure-bot-service-4.0)
- [Azure Bot Service Introduction](https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [Azure Bot Service Documentation](https://docs.microsoft.com/azure/bot-service/?view=azure-bot-service-4.0)
- [Azure CLI](https://docs.microsoft.com/cli/azure/?view=azure-cli-latest)
- [Azure Portal](https://portal.azure.com)
- [Language Understanding using LUIS](https://docs.microsoft.com/en-us/azure/cognitive-services/luis/)
- [Channels and Bot Connector Service](https://docs.microsoft.com/en-us/azure/bot-service/bot-concepts?view=azure-bot-service-4.0)
- [Restify](https://www.npmjs.com/package/restify)
- [dotenv](https://www.npmjs.com/package/dotenv)

[CLU_ServiceDocHomepage]: https://docs.microsoft.com/azure/cognitive-services/language-service/conversational-language-understanding/overview
[CLU_ServiceQuickStart]: https://docs.microsoft.com/azure/cognitive-services/language-service/conversational-language-understanding/quickstart
[languagestudio]: https://language.azure.com/
