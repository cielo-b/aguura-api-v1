const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const paymentSchema = mongoose.Schema(
    {
        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
            required: true,
        },
        
        activeDay: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ActiveDay',
            required: true,
        },

        method: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'PaymentMethod',
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        customerName: {
            type: String,
            required: true,
        },

        customerPhone: {
            type: String,
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
