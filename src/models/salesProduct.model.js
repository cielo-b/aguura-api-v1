const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const salesProductSchema = mongoose.Schema(
    {
        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
        },

        distributionPoint: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'DistributionPoint',
        },

        inventoryProduct: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'InventoryProduct',
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
        },

        ebmItemCode: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
salesProductSchema.plugin(toJSON);

/**
 * @typedef SalesProduct
 */

const SalesProduct = mongoose.model('SalesProduct', salesProductSchema);

module.exports = SalesProduct;
