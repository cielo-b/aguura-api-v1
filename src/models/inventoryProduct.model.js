const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const inventoryProductSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
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
            required: true,
        },

        prevDayRemaining: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to ensure productName is updated based on name
inventoryProductSchema.pre('save', function (next) {
    this.productName = this.name.replace(/\s/g, '').toLowerCase();
    next();
});

// add plugin that converts mongoose to json
inventoryProductSchema.plugin(toJSON);

/**
 * @typedef InventoryProduct
 */

const InventoryProduct = mongoose.model('InventoryProduct', inventoryProductSchema);

module.exports = InventoryProduct;
