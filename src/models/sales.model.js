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
        },

        distributionPoint: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'DistributionPoint',
        },

        producer: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Producer',
        },

        inventory: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Inventory',
        },

        customer: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
        },

        products: [
            {
                product: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'Product',
                },
                salesProduct: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'SalesProduct',
                },
                inventoryProduct: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'InventoryProduct',
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
                },
                taxTyCd: {
                    code: {type: String},
                    name: {type: String}
                },
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
            default: false
        },

        customerName: {
            type: String,
            required: true,
        },

        customerPhone: {
            type: String,
        },

        purchase: {
            type: Number,
        },

        rct: {
            rcptNo: {type: Number},
            intrlData: {type: String},
            rcptSign: {type: String},
            totRcptNo: {type: Number},
            vsdcRcptPbctDate: {type: String},
            sdcId: {type: String},
            mrcNo: {type: String}
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
