const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const producerSchema = mongoose.Schema(
    {
        manager: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },

        name: {
            type: String,
            required: true,
            unique: true
        },

        location: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            required: true,
            default: 'drinks'
        },

        distributionPoints: [
            {
                id: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'DistributionPoint',
                    required: true,
                },
                totalPurchases: {
                    type: Number,
                    default: parseFloat('0')
                }
            }
        ],

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

        customers: [
            {
                id: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'User',
                    required: true
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
producerSchema.plugin(toJSON);

/**
 * @typedef Producer
 */

const Producer = mongoose.model('Producer', producerSchema);

module.exports = Producer;
