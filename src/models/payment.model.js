const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const paymentSchema = mongoose.Schema(
    {
        activeDay: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ActiveDay',
            required: true,
        },
        
        amount: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'PaymentMethod',
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
paymentSchema.plugin(toJSON);

/**
 * @typedef Payment
 */

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
