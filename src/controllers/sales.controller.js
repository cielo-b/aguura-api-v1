const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct, Sales, Credit} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkActive, checkDay} = require('./activeDay.controller');
const formatNumber = require('../utils/numberFormat');

const newSales = catchAsync(async (req, res) => {

    const {products: reqProducts, isFullyPaid, customerName, customerPhone, amountPaid} = req.body;

    const activeDay = await checkDay();

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No active day, plz start new day and try again.'
        });
    }

    let products = [];
    let totalPrice = 0;
    let description = ``;

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id).populate('inventoryProduct');

        const salesProduct = {
            name: product.inventoryProduct.name,
            quantity: reqProduct.quantity,
            unitPrice: product.inventoryProduct.price,
            totalPrice: product.inventoryProduct.price * reqProduct.quantity
        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description = description + `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} \n`;
    }

    // handle amount
    let amount = isFullyPaid ? totalPrice : amountPaid;

    const sales = await Sales.create({activeDay: activeDay.id, products, totalPrice, isFullyPaid, customerName, customerPhone, amountPaid: amount, description});

    if (!sales) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something went wrong, plz try again.'
        });
    }

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id);
        let inventoryProduct = await InventoryProduct.findById(product.inventoryProduct);

        inventoryProduct.totalAvailable = product.totalAvailable - reqProduct.quantity;
        await inventoryProduct.save({validateBeforeSave: false});
    }

    // if not fully paid, create new credit
    if (!isFullyPaid) {
        const credit = await Credit.create({sales: sales.id, totalAmount: totalPrice - amountPaid, description, customerName, customerPhone});

        if (!credit) {
            return res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Sales recorded successfully but, credit failed to be recorder.',
            });
        }
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Sales recorded successfully.',
    });
});

const allSales = catchAsync(async (req, res) => {
    const sales = await Sales.find({}, {activeDay: 0, products: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        sales
    });
});


const dailySales = catchAsync(async (req, res) => {

    const dayId = req.params.dayId;
    const activeDay = await checkActive(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No active day, plz start new day and try again.'
        });
    }

    const sales = await Sales.find({activeDay: dayId}, {activeDay: 0, products: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        sales
    });

});

const salesStats = catchAsync(async (req, res) => {
    const sales = await Sales.find({}, {activeDay: 0, products: 0});

    let totalSales = 0;
    let totalAmountSold = 0;

    sales.forEach(sale => {
        totalSales++;
        totalAmountSold += sale.totalPrice;
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stats: {
            totalSales,
            totalAmountSold
        }
    });
});


module.exports = {
    newSales,
    allSales,
    dailySales,
    salesStats
};
