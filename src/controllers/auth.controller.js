const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const catchAsync = require('../utils/catchAsync');
const {authService, userService, tokenService} = require('../services');
const {Token, User, Order, Stock, Sales} = require('../models');
const {checkStock} = require('./stock.controller');
const config = require('../config/config');
const {tokenTypes} = require('../config/tokens');


const register = catchAsync(async (req, res) => {

    let {fullName, phone, password, role} = req.body;

    const stocks = await Stock.find({});

    if (stocks.length === 0 && role !== 'superAdmin') {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Stocks Availabel Yet. Plz Try Again Later.'
        });
    }

    if (await User.isPhoneTaken(phone)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Phone Already Taken.'
        });
    }

    const user = await userService.createUser({fullName, phone, password, role});
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

    const _tokens = await Token.find({user: user.id});

    for (let token of _tokens) {
        if (token) {
            await token.deleteOne();
        }
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
            message: 'User Not Found.'
        });
    }

    res.status(httpStatus.OK).json({
        success: true,
        user,
    });
});

const setFCMToken = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    user.fcmToken = req.body.fcmToken;
    await user.save({validateBeforeSave: false});

    res.status(httpStatus.OK).json({
        success: true,
    });
});

const logout = catchAsync(async (req, res) => {
    const tokenDoc = await Token.findOne({token: req.body.refreshToken, type: tokenTypes.REFRESH, blacklisted: false});
    if (!tokenDoc) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong.'
        });
    }
    await tokenDoc.deleteOne();
    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Logged Out Successfully',
    });
});

const refreshTokens = catchAsync(async (req, res) => {
    const token = req.body.refreshToken;
    const type = 'refresh';
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await Token.findOne({token, type, user: payload.sub, blacklisted: false}).lean(false);
    if (!tokenDoc) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Authenticate.'
        });
    }

    const user = await userService.getUserById(tokenDoc.user);
    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Authenticate.'
        });
    }
    await tokenDoc.deleteOne();
    const tokens = await tokenService.generateAuthTokens(user);

    // const current = tokens.refresh.token;
    // const prevTokens = await Token.find({user: user.id});
    // for (let token of prevTokens) {
    //     if (token.token.toString() !== current.toString()) {
    //         await token.deleteOne();
    //     }
    // }

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
        message: 'Password Reset Email Was Sent To Your Email.'
    });
});

const resetPassword = catchAsync(async (req, res) => {
    await authService.resetPassword(req.query.token, req.body.password);
    res.status(httpStatus.OK).json({
        success: true,
        message: 'Password Reset Successfully.'
    });
});


const addUser = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    let {fullName, phone} = req.body;

    if (await User.isPhoneTaken(phone)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Phone Already Taken.'
        });
    }
    const password = 'abc@' + phone.substring(phone.length - 5);
    const role = 'user';

    const user = await userService.createUser({fullName, phone, password, role, stock: stock.id});

    res.status(httpStatus.CREATED).json({
        success: true,
        user,
        message: 'Customer Added Successfully.'
    });
});

const allCutomers = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    let customers = [];

    const users = await User.find({stocks: {$in: [stockId]}});

    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const orders = await Order.find({customer: u.id, stock: stockId});
        let totalOrdersAmount = 0;
        for (const order of orders) {
            totalOrdersAmount += order.totalPrice;
        }

        const sales = await Sales.find({customer: u.id, stock: stockId});
        let totalSales = 0;
        for (const sale of sales) {
            totalSales += sale.totalPrice;
        }

        customers.push({
            name: u.fullName,
            phone: u.phone ? u.phone : '',
            totalOrders: orders.length,
            totalOrdersAmount: totalOrdersAmount,
            id: u.id,
            totalSales: sales.length,
            totalSalesAmount: totalSales
        });
    }


    res.status(httpStatus.CREATED).json({
        success: true,
        customers
    });
});

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    getUser,
    setFCMToken,

    addUser,
    allCutomers
};
