const httpStatus = require('http-status');

const {PaymentMethod} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkStock} = require('./stock.controller');

const newMethod = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const {name} = req.body;
    const methodName = name.replace(/\s/g, '').toLowerCase();

    const method = await PaymentMethod.findOne({methodName, stock: stock.id});

    if (method) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Method Already Exist.',
        });
    }

    const newMethod = await PaymentMethod.create({name, methodName, stock: stock.id});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Method Added Successfully.',
        method: newMethod
    });

});


const editMethod = catchAsync(async (req, res) => {

    const method = await PaymentMethod.findById(req.params.methodId);

    if (!method) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Method Not Found.',
        });
    }


    const {name} = req.body;
    const methodName = name.replace(/\s/g, '').toLowerCase();

    const _method = await PaymentMethod.findOne({methodName});

    if (_method) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Method Elready Exist.',
        });
    }

    method.name = name;
    method.methodName = methodName;

    await method.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Method Edited Successfully.',
        method
    });

});

const allmethods = catchAsync(async (req, res) => {
    const methods = await PaymentMethod.find({stock: req.query.stockId}, {methodName: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        methods
    });
});



module.exports = {
    newMethod,
    editMethod,
    allmethods
};
