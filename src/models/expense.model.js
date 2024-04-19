const mongoose = require('mongoose');
const {toJSON} = require('./plugins');

const expenseSchema = mongoose.Schema(
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

        amount: {
            type: Number,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
expenseSchema.plugin(toJSON);

/**
 * @typedef Expense
 */

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
