const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const orderSchema = mongoose.Schema(
    {
        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
            required: true,
        },
        
        customer: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
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

        description: {
            type: String,
            required: true,
        },

        totalPrice: {
            type: Number,
            required: true,
        },

        isFullyPaid: {
            type: Boolean,
            required: true,
            default: false
        },

        isCompleted: {
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
orderSchema.plugin(toJSON);

/**
 * @typedef Order
 */

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
