const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const salesProductSchema = mongoose.Schema(
    {
        inventoryProduct: {
            type: mongoose.SchemaTypes.ObjectId,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
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
