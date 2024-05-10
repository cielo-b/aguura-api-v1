const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');

const {Stock, User, Company} = require('../models');
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

    const {name, fullName, phone, password, type, description, companies} = req.body;
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

    const newStock = await Stock.create({superAdmin: user.id, admin: admin.id, name, stockName, type, description});

    // create associate companies
    for (let c of companies) {
        await Company.create({name: c.name, stock: newStock.id});
    }

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


    const {name, fullName, phone, password, type, description, companies} = req.body;

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
    stock.description = description ? description : stock.description;

    await stock.save({validateBeforeSave: false});

    // update associate companies
    for (let c of companies) {
        const company = await Company.findById(c.id);
        if (company) {
            company.name = c.name;
            await company.save({validateBeforeSave: false});
        } else {
            await Company.create({name: c.name, stock: stock.id});
        }
    }

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
    stocks = await Promise.all(stocks.map(async (stock) => {
        let companies = await Company.find({stock: stock.id});
        companies = companies.map(c => {
            return {
                name: c.name,
                id: c._id
            };
        });
        return {
            managerName: stock.admin.fullName,
            managerPhone: stock.admin.phone,
            id: stock.id,
            name: stock.name,
            type: stock.type,
            description: stock.description,
            companies
        };
    }));


    return res.status(httpStatus.OK).json({
        success: true,
        stocks
    });
});

const getStockByAdmin = catchAsync(async (req, res) => {

    let stock = await Stock.findOne({admin: req.query.adminId});
    let companies = await Company.find({stock: stock.id});

    companies = companies.map(c => {
        return {
            name: c.name,
            id: c._id
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stock: {
            ...stock.toObject(),
            companies
        }
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
    let companies = await Company.find({stock: stock.id});
    companies = companies.map(c => {
        return {
            name: c.name,
            id: c._id
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stock: {
            ...stock.toObject(),
            companies
        }
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
    let companies = await Company.find({stock: stock.id});
    companies = companies.map(c => {
        return {
            name: c.name,
            id: c._id
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stock: {
            ...stock.toObject(),
            companies
        }
    });
});

const getAllStocks = catchAsync(async (req, res) => {

    let stocks = await Stock.find({type: req.query.type}).populate('admin');
    stocks = await Promise.all(stocks.map(async (stock) => {
        let companies = await Company.find({stock: stock.id});
        companies = companies.map(c => {
            return {
                name: c.name,
                id: c._id
            };
        });
        return {
            managerName: stock.admin.fullName,
            managerPhone: stock.admin.phone,
            id: stock.id,
            name: stock.name,
            type: stock.type,
            description: stock.description,
            companies
        };
    }));

    return res.status(httpStatus.OK).json({
        success: true,
        stocks
    });
});

const addStocks = catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    const {stockIds} = req.body;

    for (let id of stockIds) {
        const stock = await Stock.findById(id);
        if (stock) {
            let userStocks = user.stocks;
            let customers = stock.customers;

            if (!userStocks.includes(stock.id)) {
                userStocks.push(stock.id);
            }

            if (!customers.includes(user.id)) {
                customers.push(user.id);
                stock.customers = customers;
                await stock.save({validateBeforeSave: false});
            }

            user.stocks = userStocks;
            await user.save({validateBeforeSave: false});
        }

    }

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Successfully Added Stocks.'
    });
});

const myStocks = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    let stocks = [];
    for (let stock of user.stocks) {
        const _stock = await Stock.findById(stock).populate('admin');
        let companies = await Company.find({stock: _stock.id});
        stock.companies = companies.map(c => {
            return {
                name: c.name,
                id: c._id
            };
        });
        stocks.push({
            managerName: _stock.admin.fullName,
            managerPhone: _stock.admin.phone,
            id: _stock.id,
            name: _stock.name,
            type: _stock.type,
            description: _stock.description,
            companies
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        stocks
    });
});


const stockCompanies = catchAsync(async (req, res) => {
    const stock = await Stock.findById(req.query.stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const companies = await Company.find({stock: stock.id});

    return res.status(httpStatus.OK).json({
        success: true,
        companies
    });
});

module.exports = {
    newStock,
    editStock,
    allStocks,
    getStockByAdmin,
    getStockByCustomer,
    getStock,
    checkStock,
    getAllStocks,
    addStocks,
    myStocks,
    stockCompanies
};
