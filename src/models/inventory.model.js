const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const inventorySchema = mongoose.Schema(
    {
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

        activeDay: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ActiveDay',
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        products: [
            {
                id: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'InventoryProduct',
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

        totalPrice: {
            type: Number,
            required: true,
        },

        isOwn: {
            type: Boolean,
            required: false,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
inventorySchema.plugin(toJSON);

/**
 * @typedef Inventory
 */

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
