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
        
        customer: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
        },

        products: [
            {
                id: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'SalesProduct',
                    required: true,
                },
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

        payments: [
            {
                id: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'PaymentMethod',
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                }
            }
        ],

        description: {
            type: String,
            required: true,
        },

        paymentDescription: {
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
        
        fromOrder: {
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
