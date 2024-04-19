const httpStatus = require('http-status');

const {Expense} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkStock} = require('./stock.controller');
const {checkDay} = require('./activeDay.controller');

const newExpense = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const activeDay = await checkDay(stockId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Active Day Not Found.'
        });
    }

    const {name, amount} = req.body;

    const expense = await Expense.create({stock: stock.id, activeDay: activeDay.id, name, amount});

    if (!expense) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Expense Recorded Successfully.',
    });
});


const editExpense = catchAsync(async (req, res) => {

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Expense Not Found.'
        });
    }

    const {name, amount} = req.body;

    expense.name = name ? name : expense.name;
    expense.amount = amount ? amount : expense.amount;

    await expense.save({validateBeforeSave: false});


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Expense Edited Successfully.',
    });
});


const allExpenses = catchAsync(async (req, res) => {

    const expenses = await Expense.find({stock: req.query.stockId});

    return res.status(httpStatus.OK).json({
        success: true,
        expenses
    });
});


const dailyExpenses = catchAsync(async (req, res) => {

    const expenses = await Expense.find({stock: req.query.stockId, activeDay: req.query.activeDayId});

    return res.status(httpStatus.OK).json({
        success: true,
        expenses
    });
});


module.exports = {
    newExpense,
    editExpense,
    allExpenses,
    dailyExpenses
};
