const axios = require('axios');
require('dotenv').config();
const qs = require('qs');  // Import the 'qs' module to format data

const getAccessToken = async () => {
    const client_id = process.env.AMADEUS_CLIENT_ID;
    const client_secret = process.env.AMADEUS_CLIENT_SECRET;
    const data = qs.stringify({
        grant_type: 'client_credentials',
        client_id,
        client_secret
    });

    try {
        const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const getIATACodeFromCity = async (cityName, accessToken) => {
    const url = 'https://test.api.amadeus.com/v1/reference-data/locations';

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                keyword: cityName,
                subType: 'CITY,AIRPORT'
            }
        });

        // Find the first location that matches the city name
        const location = response.data.data.find(
            location => location.address && location.address.cityName.toLowerCase() === cityName.toLowerCase()
        );

        if (location && location.iataCode) {
            return location.iataCode;
        } else {
            throw new Error(`IATA code for city ${cityName} not found`);
        }
    } catch (error) {
        console.error('Error fetching IATA code:', error.message);
        throw error;
    }
};

const getAvailableFlights = async (reqQuery) => {
    const accessToken = await getAccessToken();

    // Convert city names to IATA codes
    const originIATA = await getIATACodeFromCity(reqQuery.origin, accessToken);
    const destinationIATA = await getIATACodeFromCity(reqQuery.destination, accessToken);

    const queryDate = new Date(reqQuery.travelDate).toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originIATA}&destinationLocationCode=${destinationIATA}&departureDate=${queryDate}&adults=${reqQuery.travelers}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const availableFlights = response.data.data;

        const filteredFlights = availableFlights.filter(flight => {
            const seatsLeft = flight.numberOfBookableSeats;
            return seatsLeft >= reqQuery.travelers;
        });

        return filteredFlights;
    } catch (error) {
        console.error('Error fetching flight data:', error.message);
        throw error;
    }
};

const getAllFlights = async () => {
    throw new Error('getAllFlights not implemented. Use getAvailableFlights with specific parameters.');
};

module.exports = {
    getAvailableFlights,
    getAllFlights
};
