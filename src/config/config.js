const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
        PAYSTACK_SECRET: Joi.string().required(),
        PORT: Joi.string().default(3000)
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${ error.message }`);
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    paystackSecret: envVars.PAYSTACK_SECRET
};
