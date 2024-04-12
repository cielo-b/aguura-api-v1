const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {authService, userService, tokenService} = require('../services');
const {Token, User} = require('../models');


const superAdminRegister = catchAsync(async (req, res) => {

    let reqBody = req.body;
    reqBody.role = 'superAdmin';

    if (await User.isPhoneTaken(reqBody.phone)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Phone already taken.'
        });
    }

    const user = await userService.createUser(reqBody);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).json({
        success: true,
        tokens,
        user
    });
});

const adminRegister = catchAsync(async (req, res) => {

    let reqBody = req.body;
    reqBody.role = 'admin';
    console.log(reqBody);

    if (await User.isPhoneTaken(phone)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Phone already taken.'
        });
    }

    const user = await userService.createUser(reqBody);
    console.log(user);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).json({
        success: true,
        tokens,
        user
    });
});


const register = catchAsync(async (req, res) => {

    let reqBody = req.body;
    reqBody.role = 'user';

    if (await User.isPhoneTaken(reqBody.phone)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Phone already taken.'
        });
    }

    const user = await userService.createUser(reqBody);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).json({
        success: true,
        tokens,
        user
    });
});

const login = catchAsync(async (req, res) => {
    const {phone, password} = req.body;
    const user = await authService.loginWithPhoneAndPassword(phone, password);

    const token = await Token.findOne({user: user.id});

    if (token) {
        await token.deleteOne();
    }

    const tokens = await tokenService.generateAuthTokens(user);

    res.status(httpStatus.OK).json({
        success: true,
        tokens,
        user
    });
});

const getUser = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User not found.'
        });
    }

    res.status(httpStatus.OK).json({
        success: true,
        user,
    });
});

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(httpStatus.OK).json({
        success: true,
        message: 'Logged out successfully',
    });
});

const refreshTokens = catchAsync(async (req, res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    return res.status(httpStatus.OK).json({
        success: true,
        tokens
    });
});

const forgotPassword = catchAsync(async (req, res) => {
    const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
    await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
    res.status(httpStatus.OK).json({
        success: true,
        message: 'Password reset email was sent to your email.'
    });
});

const resetPassword = catchAsync(async (req, res) => {
    await authService.resetPassword(req.query.token, req.body.password);
    res.status(httpStatus.OK).json({
        success: true,
        message: 'Password reset successfully.'
    });
});


module.exports = {
    superAdminRegister,
    adminRegister,
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    getUser
};
