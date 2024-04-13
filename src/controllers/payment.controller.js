const httpStatus = require('http-status');

const {Payment} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkActive} = require('./activeDay.controller');
const {checkStock} = require('./stock.controller');


const allPayments = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }
    let payments = await Payment.find({stock: stock.id}, {activeDay: 0}).populate('method');
    payments = payments.map(payment => {
        return {
            id: payment.id,
            customerName: payment.customerName,
            customerPhone: payment.customerPhone,
            amount: payment.amount,
            date: payment.date,
            method: payment.method.name,
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        payments
    });
});


const dailyPayments = catchAsync(async (req, res) => {

    const dayId = req.params.dayId;
    const activeDay = await checkActive(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }

    let payments = await Payment.find({activeDay: dayId}, {activeDay: 0}).populate('method');
    payments = payments.map(payment => {
        return {
            id: payment.id,
            customerName: payment.customerName,
            customerPhone: payment.customerPhone,
            amount: payment.amount,
            date: payment.date,
            method: payment.method.name,
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        payments
    });

});



module.exports = {
    allPayments,
    dailyPayments,
};
