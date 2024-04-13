const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const creditSchema = mongoose.Schema(
    {
        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
            required: true,
        },

        sales: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Sales',
            required: true,
        },

        amountPaid: {
            type: Number,
            required: true,
            default: 0
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        isFullyPaid: {
            type: Boolean,
            required: true,
            default: false
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
creditSchema.plugin(toJSON);

/**
 * @typedef Credit
 */

const Credit = mongoose.model('Credit', creditSchema);

module.exports = Credit;
