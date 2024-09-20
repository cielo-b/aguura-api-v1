const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const paymentSchema = mongoose.Schema(
  {
    stock: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stock",
    },

    producer: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Producer",
    },

    distributionPoint: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "DistributionPoint",
    },

    customer: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },

    activeDay: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "ActiveDay",
      required: true,
    },

    method: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },

    sale: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Sales",
    },

    amount: {
      type: Number,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    customerPhone: {
      type: String,
    },

    isCreditPayment: {
      type: Boolean,
      default: false,
    },

    credit: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Credit",
    },

    isMine: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
paymentSchema.plugin(toJSON);

/**
 * @typedef Payment
 */

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
