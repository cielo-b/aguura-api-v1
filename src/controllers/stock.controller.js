const httpStatus = require('http-status');

const {Stock, User, ActiveDay} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {userService, ebmService} = require('../services');

const newStock = catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    const {name, fullName, phone, password, type, description, location} = req.body;
    const stockName = name.replace(/\s/g, '').toLowerCase();

    const stock = await Stock.findOne({stockName, superAdmin: user.id});

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

    const newStock = await Stock.create({superAdmin: user.id, admin: admin.id, name, stockName, type, description, location});
    user.monthlyPayment = user.monthlyPayment + parseFloat('50');

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


    const {name, fullName, phone, password, type, description} = req.body;

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
    stocks = stocks.map((stock) => {
        return {
            managerName: stock.admin.fullName,
            managerPhone: stock.admin.phone,
            id: stock.id,
            name: stock.name,
            type: stock.type,
            description: stock.description,
            location: stock.location
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stocks
    });
});

const getStockByAdmin = catchAsync(async (req, res) => {

    let stock = await Stock.findOne({admin: req.query.adminId});
    const activeDay = await ActiveDay.findOne({isActive: true, stock: stock.id});

    return res.status(httpStatus.OK).json({
        success: true,
        stock: {
            ...stock.toObject(),
        },
        activeDay
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
        stock: {
            ...stock.toObject(),
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
    return res.status(httpStatus.OK).json({
        success: true,
        stock: {
            ...stock.toObject(),
        }
    });
});

const getAllStocks = catchAsync(async (req, res) => {

    let stocks = await Stock.find({type: req.query.type}).populate('admin');
    stocks = await Promise.all(stocks.map(async (stock) => {
        return {
            managerName: stock.admin.fullName,
            managerPhone: stock.admin.phone,
            id: stock.id,
            name: stock.name,
            type: stock.type,
            description: stock.description,
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

                // check ebm stock
                if (user.tin) {
                    const manager = await User.findById(stock.admin);
                    const response = await ebmService.selectCustomer({
                        tin: manager.tin,
                        bhfId: manager.bhfId,
                        custmTin: user.tin
                    });

                    if (response.resultCd === '001') {
                        const rsp = await ebmService.saveCustomer({
                            tin: manager.tin,
                            bhfId: manager.bhfId,
                            custNo: 999991113,
                            custTin: user.tin,
                            custNm: user.fullName,
                            adrs: null,
                            telNo: user.phone,
                            email: user.email,
                            faxNo: null,
                            useYn: "Y",
                            remark: null,
                            regrId: stock.id.slice(0, 20),
                            regrNm: stock.name,
                            modrNm: manager.fullName,
                            modrId: manager.id.slice(0, 20),
                        });

                        console.log(rsp);
                    }
                }
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
        stocks.push({
            managerName: _stock.admin.fullName,
            managerPhone: _stock.admin.phone,
            id: _stock.id,
            name: _stock.name,
            type: _stock.type,
            description: _stock.description,
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        stocks
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
};
