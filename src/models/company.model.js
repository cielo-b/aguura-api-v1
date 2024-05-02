const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const companySchema = mongoose.Schema(
    {
        stock: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Stock',
            required: true,
        },

        name: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
companySchema.plugin(toJSON);

/**
 * @typedef Company
 */

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
