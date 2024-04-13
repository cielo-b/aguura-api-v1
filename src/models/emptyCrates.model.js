const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const emptyCratesSchema = mongoose.Schema(
    {
        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
            required: true,
        },
        
        activeDay: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ActiveDay',
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        number: {
            type: Number,
            required: true,
        },

        isBrarirwa: {
            type: Boolean,
            required: true
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
emptyCratesSchema.plugin(toJSON);

/**
 * @typedef EmpetyCrates
 */

const EmpetyCrates = mongoose.model('EmpetyCrates', emptyCratesSchema);

module.exports = EmpetyCrates;
