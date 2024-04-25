const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');

const {Stock, User} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {userService} = require('../services');


const newStock = catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    const {name, fullName, phone, password, type} = req.body;
    const stockName = name.replace(/\s/g, '').toLowerCase();

    const stock = await Stock.findOne({stockName});

    if (stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Already Exists.',
        });
    }

    if (await User.isPhoneTaken(phone)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Phone Already Taken.'
        });
    }

    const admin = await userService.createUser({fullName, phone, password, role: 'admin'});

    if (!admin) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Failed To Register New Stock.',
        });
    }

    const newStock = await Stock.create({superAdmin: user.id, admin: admin.id, name, stockName, type});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Stock Added Successfully.',
        stock: newStock
    });

});


const editStock = catchAsync(async (req, res) => {

    const stock = await Stock.findById(req.params.stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.',
        });
    }


    const {name, fullName, phone, password, type} = req.body;

    const stockName = name.replace(/\s/g, '').toLowerCase();

    const _stock = await Stock.findOne({stockName});

    if (_stock && (stock.id.toString() !== _stock.id.toString())) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Name Taken.',
        });
    }

    const admin = await User.findById(stock.admin);
    admin.fullName = fullName;
    admin.phone = phone;
    if (password) admin.password = password;
    await admin.save({validateBeforeSave: false});

    const sName = name ? name : stock.name;
    stock.name = sName;
    stock.stockName = stockName;
    stock.type = type ? type : stock.type;

    await stock.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Stock Edited Successfully.',
        stock
    });
});

const allStocks = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    let stocks = await Stock.find({superAdmin: user.id}).populate('admin');
    stocks = stocks.map(stock => {
        return {
            managerName: stock.admin.fullName,
            managerPhone: stock.admin.phone,
            id: stock.id,
            name: stock.name,
            type: stock.type
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stocks
    });
});

const getStockByAdmin = catchAsync(async (req, res) => {

    const stock = await Stock.findOne({admin: req.query.adminId});

    return res.status(httpStatus.OK).json({
        success: true,
        stock
    });
});

const getStockByCustomer = catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    const stock = await Stock.findById(user.stock);

    return res.status(httpStatus.OK).json({
        success: true,
        stock
    });
});

const checkStock = async (id) => {
    const stock = await Stock.findById(id);
    if (!stock) {
        return null;
    } else {
        return stock;
    }
};

const getStock = catchAsync(async (req, res) => {

    const stock = await checkStock(req.query.id);
    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        stock
    });
});



module.exports = {
    newStock,
    editStock,
    allStocks,
    getStockByAdmin,
    getStockByCustomer,
    getStock,
    checkStock
};
