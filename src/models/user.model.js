const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const {toJSON} = require('./plugins');
const {roles} = require('../config/roles');

const userSchema = mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        
        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            validate(value) {
                if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
                    throw new Error('Password must contain at least one letter and one number');
                }
            },
            private: true,
        },

        role: {
            type: String,
            required: true,
            enum: roles,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);


userSchema.statics.isPhoneTaken = async function (phone, excludeUserId) {
    const user = await this.findOne({phone, _id: {$ne: excludeUserId}});
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

userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});


/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
