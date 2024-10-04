const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const paymentMethodSchema = mongoose.Schema(
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

    type: {
      type: String,
      required: true,
      enum: ["cash", "bank transfer", "mobile money", "card"],
    },

    number: {
      type: Number,
    },

    bankName: {
      type: String,
    },

    momoRegName: {
      type: String,
    },

    bankRegName: {
      type: String,
    },

    nameOnCard: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
paymentMethodSchema.plugin(toJSON);

/**
 * @typedef PaymentMethod
 */

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

module.exports = PaymentMethod;
