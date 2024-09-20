const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const creditSchema = mongoose.Schema(
  {
    stock: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stock",
    },

    distributionPoint: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "DistributionPoint",
    },

    producer: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Producer",
    },

    activeDay: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "ActiveDay",
      required: true,
    },

    customer: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },

    sales: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Sales",
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    isFullyPaid: {
      type: Boolean,
      required: true,
      default: false,
    },

    customerName: {
      type: String,
      required: true,
    },

    customerPhone: {
      type: String,
    },

    isOwed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
creditSchema.plugin(toJSON);

/**
 * @typedef Credit
 */

const Credit = mongoose.model("Credit", creditSchema);

module.exports = Credit;
