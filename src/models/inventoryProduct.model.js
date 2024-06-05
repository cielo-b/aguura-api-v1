const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const inventoryProductSchema = mongoose.Schema(
    {
        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
        },

        distributionPoint: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'DistributionPoint',
        },

        product: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Product',
        },

        name: {
            type: String,
        },

        totalAvailable: {
            type: Number,
            required: true,
            default: 0
        },

        price: {
            type: Number,
            required: true,
        },

        productName: {
            type: String,
            trim: true,
            lowercase: true,
        },

        prevDayRemaining: {
            type: Number,
            required: true,
            default: 0
        },

        dailyAdded: {
            type: Number,
            required: true,
            default: 0
        },

        images: [
            {
                url: {
                    type: String,
                    required: true
                }
            }
        ],

        description: {
            type: String
        },

        sizes: [
            {
                size: {
                    type: String,
                    required: true,
                },
                total: {
                    type: Number,
                    required: true,
                    default: 0
                }
            }
        ],

        details: [
            {
                detail: {
                    type: String,
                    required: true,
                },
            }
        ]
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
inventoryProductSchema.plugin(toJSON);

/**
 * @typedef InventoryProduct
 */

const InventoryProduct = mongoose.model('InventoryProduct', inventoryProductSchema);

module.exports = InventoryProduct;
