const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const activeDaySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            default: () => new Date().getDate() + '-' + new Date().getMonth() + 1 + '-' + new Date().getFullYear()
        },

        isActive: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
activeDaySchema.plugin(toJSON);

/**
 * @typedef ActiveDay
 */

const ActiveDay = mongoose.model('ActiveDay', activeDaySchema);

module.exports = ActiveDay;
