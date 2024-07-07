const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const productSchema = mongoose.Schema(
    {
        producer: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Producer',
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        productName: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        totalAvailable: {
            type: Number,
            required: true,
            default: parseFloat('0')
        },

        dailyAdded: {
            type: Number,
            required: true,
            default: parseFloat('0')
        },

        itemCd: {
            type: String
        },

        itemClsCd: {
            type: String
        },

        itemTyCd: {
            type: String
        },

        orgnNatCd: {
            type: String
        },

        pkgUnitCd: {
            type: String
        },
        
        qtyUnitCd: {
            type: String
        }

    },
    {
        timestamps: true,
    }
);


// add plugin that converts mongoose to json
productSchema.plugin(toJSON);

/**
 * @typedef Product
 */

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
