const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const creditSchema = mongoose.Schema(
    {
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

        isFullyPaid: {
            type: Boolean,
            required: true,
            default: false
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
