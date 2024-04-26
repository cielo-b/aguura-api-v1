const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const stockShema = mongoose.Schema(
    {
        superAdmin: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },

        admin: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        stockName: {
            type: String,
            required: true,
        },

        customers: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'User',
                required: true
            }
        ],

        type: {
            type: String,
            required: true,
            enum: [
                'pharmacy',
                'beer',
                'fashion',
                'electronics',
                'others'
            ]
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to ensure productName is updated based on name
stockShema.pre('save', function (next) {
    this.stockName = this.name.replace(/\s/g, '').toLowerCase();
    next();
});

// add plugin that converts mongoose to json
stockShema.plugin(toJSON);

/**
 * @typedef Stock
 */

const Stock = mongoose.model('Stock', stockShema);

module.exports = Stock;
