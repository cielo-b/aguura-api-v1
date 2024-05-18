const httpStatus = require('http-status');

const {Credit, Sales, PaymentMethod, Payment} = require('../models');
const catchAsync = require('../utils/catchAsync');
const formatNumber = require('../utils/formatNumber');

const payCredit = catchAsync(async (req, res) => {

    const {creditId, amount, payments, activeDay} = req.body;

    const credit = await Credit.findById(creditId);
    const sales = await Sales.findById(credit.sales);

    if (!credit) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Credit Not Found.',
        });
    }

    if (amount > 0) {
        if (payments.length === 0) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Plz Add How User Paid.'
            });
        } else {
            let total = 0;
            for (const p of payments) {
                total += parseInt(p.amount);
            }
            if (parseInt(total) !== parseInt(amount)) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
                });
            }
        }
    }

    let desc = ``;

    credit.amountPaid = parseInt(credit.amountPaid) + parseInt(amount);
    sales.amountPaid = parseInt(sales.amountPaid) + parseInt(amount);

    if (credit.amountPaid >= credit.totalAmount) {
        credit.isFullyPaid = true;
    }
    if (credit.isFullyPaid) {
        sales.isFullyPaid = true;
    }

    await credit.save({validateBeforeSave: false});
    await sales.save({validateBeforeSave: false});

    if (payments.length > 0) {
        for (const payment of payments) {
            desc = `${payment.name}: ${formatNumber(payment.amount)} Rwf\n`;
            let method = await PaymentMethod.findById(payment.id);
            await Payment.create({activeDay: activeDay, method: method.id, customerName: credit.customerName, customerPhone: credit.customerPhone, amount: payment.amount, stock: credit.stock, customer: credit.customer, sale: credit.sale, credit: credit.id, isCreditPayment: true});
        }
    }
    const spd = sales.paymentDescription.replace(/\s/g, '').toLowerCase();
    sales.paymentDescription = spd !== 'nopaymentsyet.' ? sales.paymentDescription + desc : desc;
    await sales.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Credit Paid Successfully.',
    });

});


const adminCredits = catchAsync(async (req, res) => {
    const {isFullyPaid, entityType, entityId} = req.query;

    const credits = await Credit.find({isFullyPaid, [entityType]: entityId});

    return res.status(httpStatus.OK).json({
        success: true,
        credits
    });

});


const myCredits = catchAsync(async (req, res) => {
    const credits = await Credit.find({isFullyPaid: false, customer: req.user._id, stock: req.query.stockId}).populate('sales');

    return res.status(httpStatus.OK).json({
        success: true,
        credits
    });

});

module.exports = {
    payCredit,
    adminCredits,
    myCredits
};
