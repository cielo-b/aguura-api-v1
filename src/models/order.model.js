const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const orderSchema = mongoose.Schema(
    {
        activeDay: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ActiveDay',
        },

        distributionPoint: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'DistributionPoint',
        },

        producer: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Producer',
        },

        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
        },

        sale: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Sales',
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
        },

        isMine: {
            type: Boolean,
            required: true,
            default: false
        },

        customerName: {
            type: String,
        },

        phone: {
            type: String,
        },

        status: {
            type: String,
            enum: [
                'completed',
                'pending',
                'invented'
            ],
            default: 'pending'
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
