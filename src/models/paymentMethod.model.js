const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const paymentMethodSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        methodName: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
paymentMethodSchema.plugin(toJSON);

/**
 * @typedef PaymentMethod
 */

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
