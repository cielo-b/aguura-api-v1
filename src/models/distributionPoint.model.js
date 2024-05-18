const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const distributionPointSchema = mongoose.Schema(
    {
        manager: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            required: true,
            default: 'drinks'
        },

        location: {
            type: String,
            required: true,
        },

        stocks: [
            {
                id: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'Stock',
                    required: true,
                },
                totalPurchases: {
                    type: Number,
                    default: parseFloat('0')
                }
            }
        ],

    },
    {
        timestamps: true,
    }
);


// add plugin that converts mongoose to json
distributionPointSchema.plugin(toJSON);

/**
 * @typedef DistributionPoint
 */

const DistributionPoint = mongoose.model('DistributionPoint', distributionPointSchema);

module.exports = DistributionPoint;
