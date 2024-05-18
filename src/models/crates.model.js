const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const cratesSchema = mongoose.Schema(
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

        customer: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
        },

        products: [
            {
                id: {
                    type: String,
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                given: {
                    type: Number,
                    required: true,
                },
                returned: {
                    type: Number,
                    required: true,
                    default: 0
                },
                remaining: {
                    type: Number,
                    required: true,
                }
            }
        ],

        allReturned: {
            type: Boolean,
            required: true,
            default: false
        },

        customerName: {
            type: String,
            required: true,
        },

        customerPhone: {
            type: String,
        },

        renderedTo: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
cratesSchema.plugin(toJSON);

/**
 * @typedef Crates
 */

const Crates = mongoose.model('Crates', cratesSchema);

module.exports = Crates;
