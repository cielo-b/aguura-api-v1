const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const expenseSchema = mongoose.Schema(
  {
    producer: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Producer",
    },

    distributionPoint: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "DistributionPoint",
    },

    stock: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stock",
    },

    activeDay: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "ActiveDay",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
expenseSchema.plugin(toJSON);

/**
 * @typedef Expense
 */

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
