const httpStatus = require('http-status');

const {Credit, Sales} = require('../models');
const catchAsync = require('../utils/catchAsync');


const payCredit = catchAsync(async (req, res) => {

    const {creditId, amount} = req.body;

    const credit = await Credit.findById(creditId);
    const sales = await Sales.findById(credit.sales);

    if (!credit) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Credit not found.',
        });
    }

    credit.amountPaid += amount;
    sales.amountPaid += amount;

    if (credit.amountPaid >= credit.totalAmount) {
        credit.isFullyPaid = true;
    }
    if (credit.isFullyPaid) {
        sales.isFullyPaid = true;
    }

    await credit.save({validateBeforeSave: false});
    await sales.save({validateBeforeSave: false});


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Credit paid successfully.',
    });

});


const adminCredits = catchAsync(async (req, res) => {

    const credits = await Credit.find({isFullyPaid: req.query.isFullyPaid});

    return res.status(httpStatus.OK).json({
        success: true,
        credits
    });

});

module.exports = {
    payCredit,
    adminCredits
};
