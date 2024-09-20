const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { toJSON } = require("./plugins");

const userSchema = mongoose.Schema(
  {
    stocks: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Stock",
        required: true,
      },
    ],

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      countryCode: {
        type: String,
        required: true,
        trim: true,
      },
      number: {
        type: String,
        required: true,
        trim: true,
      },
    },

    email: {
      type: String,
      // required: true,
      // trim: true,
      // unique: true,
    },

    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number.",
          );
        }
      },
      private: true,
    },

    role: {
      type: String,
      required: true,
    },

    fcmToken: {
      type: String,
    },

    monthlyPayment: {
      type: Number,
      required: true,
      default: parseFloat(0),
    },

    tin: {
      type: String,
    },

    bhfId: {
      type: String,
    },

    dvcSrlNo: {
      type: String,
    },

    credit: {
      type: Number,
    },

    suspended: {
      type: Boolean,
      default: false,
    },

    country: {
      type: String,
      required: true,
    },

    countryCode: {
      type: String,
      required: true,
      default: "RW",
    },

    isVerfied: {
      type: Boolean,
      required: true,
      default: false,
    },

    hasEbm: {
      type: Boolean,
      required: true,
      default: false,
    },

    initialSales: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

userSchema.statics.isPhoneTaken = async function (phone, excludeUserId) {
  const user = await this.findOne({ phone, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model("User", userSchema);

module.exports = User;
