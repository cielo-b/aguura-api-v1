const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const inventorySchema = mongoose.Schema(
    {
        activeDay: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ActiveDay',
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

        totalPrice: {
            type: Number,
            required: true,
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
