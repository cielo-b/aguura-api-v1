const httpStatus = require('http-status');

const {Payment} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkActive} = require('./activeDay.controller');


const allPayments = catchAsync(async (req, res) => {
    const sales = await Payment.find({}, {activeDay: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        sales
    });
});


const dailyPayments = catchAsync(async (req, res) => {

    const dayId = req.params.dayId;
    const activeDay = await checkActive(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No active day, plz start new day and try again.'
        });
    }

    const payments = await Payment.find({activeDay: dayId}, {activeDay: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        payments
    });

});



module.exports = {
    allPayments,
    dailyPayments,
};
