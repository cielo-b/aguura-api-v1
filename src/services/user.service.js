const httpStatus = require('http-status');
const {User} = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
    const user = await User.create(userBody);
    return user;
};


const queryUsers = async (filter, options) => {
    const users = await User.paginate(filter, options);
    return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
    return User.findById(id);
};


/**
 * Get user by username
 * @param {string} username
 * @returns {Promise<User>}
 */
const getUserByUserName = async (username) => {
    return User.findOne({username});
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (updateBody.username && (updateBody.username.toString() !== user.username.toString() && await User.isUsernameTaken(updateBody.username, userId))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    Object.assign(user, updateBody);
    await user.save();
    return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    await user.remove();
    return user;
};

module.exports = {
    createUser,
    queryUsers,
    getUserById,
    getUserByUserName,
    updateUserById,
    deleteUserById,
};
