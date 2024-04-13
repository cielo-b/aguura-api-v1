const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const salesSchema = mongoose.Schema(
    {
        activeDay: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ActiveDay',
            required: true,
        },

        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
            required: true,
        },

        products: [
            {
                name: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                unitPrice: {
                    type: Number,
                    required: true,
                },
                totalPrice: {
                    type: Number,
                    required: true,
                }
            }
        ],

        description: {
            type: String,
            required: true,
        },

        totalPrice: {
            type: Number,
            required: true,
        },
        
        amountPaid: {
            type: Number,
            required: true,
        },

        isFullyPaid: {
            type: Boolean,
            required: true,
            default: true
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
salesSchema.plugin(toJSON);

/**
 * @typedef Sales
 */

const Sales = mongoose.model('Sales', salesSchema);

module.exports = Sales;
