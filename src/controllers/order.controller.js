const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct, Sales, Credit, User, Order, ActiveDay} = require('../models');
const catchAsync = require('../utils/catchAsync');
const formatNumber = require('../utils/formatNumber');
const {checkDay} = require('./activeDay.controller');

const newOrder = catchAsync(async (req, res) => {

    const {products: reqProducts} = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User not found.'
        });
    }

    let products = [];
    let totalPrice = 0;
    let description = ``;

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id).populate('inventoryProduct');

        const salesProduct = {
            id: product.id,
            name: product.inventoryProduct.name,
            quantity: reqProduct.quantity,
            unitPrice: product.inventoryProduct.price,
            totalPrice: product.inventoryProduct.price * reqProduct.quantity
        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description = description + `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} \n`;

    }

    const order = await Order.create({totalPrice, products, description, customer: user.id});

    if (!order) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something went wrong, plz start new day and try again.'
        });
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Order sent successfully.',
    });

});

const editOrder = catchAsync(async (req, res) => {

    const {products: reqProducts} = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User not found.'
        });
    }

    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Order not found.'
        });
    }

    let products = [];
    let totalPrice = 0;
    let description = ``;

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id).populate('inventoryProduct');

        const salesProduct = {
            id: product.id,
            name: product.inventoryProduct.name,
            quantity: reqProduct.quantity,
            unitPrice: product.inventoryProduct.price,
            totalPrice: product.inventoryProduct.price * reqProduct.quantity
        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description = description + `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} \n`;
    }

    const order = await Order.create({totalPrice, products, description});

    if (!order) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something went wrong, plz start new day and try again.'
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Order edited successfully.',
    });

});

const completeOrder = catchAsync(async (req, res) => {

    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Order Not Found.'
        });
    }

    const activeDay = await checkDay();

    const {amountPaid} = req.body;

    // handle amount
    let paid = order.totalPrice === amountPaid;

    const sales = await Sales.create({activeDay: activeDay.id, products: order.products, totalPrice: order.totalPrice, isFullyPaid: paid, customerName: order.customer.fullName, customerPhone: order.customer.phone, amountPaid, description: order.description});

    if (!sales) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }

    // update inventory products availability
    for (let i = 0; i < order.products.length; i++) {
        let reqProduct = order.products[i];
        let product = await SalesProduct.findById(reqProduct.id);
        let inventoryProduct = await InventoryProduct.findById(product.inventoryProduct);

        inventoryProduct.totalAvailable = product.totalAvailable - reqProduct.quantity;
        await inventoryProduct.save({validateBeforeSave: false});
    }

    // if not fully paid, create new credit
    if (!paid) {
        const credit = await Credit.create({sales: sales.id, totalAmount: order.totalPrice - amountPaid, customerName: order.customer.fullName, description: order.description});

        if (!credit) {
            return res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Order Completed Successfully But, Credit Failed To Be Recorder.',
            });
        }
    }

    order.isCompleted = true;
    await order.save({validateBeforeSave: false});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Order Completed Successfully.',
    });
});


const myOrders = catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    const orders = await Order.find({customer: user.id});

    return res.status(httpStatus.OK).json({
        success: true,
        orders
    });

});

const adminOrders = catchAsync(async (req, res) => {

    let orders = await Order.find({isCompleted: req.query.isCompleted}, {products: 0}).populate('customer');
    orders = orders.map(o => {
        return {
            name: o.customer.fullName,
            description: o.description,
            id: o.id,
            isCompleted: o.isCompleted,
            isFullyPaid: o.isFullyPaid,
            totalPrice: o.totalPrice,
        };
    });
    return res.status(httpStatus.OK).json({
        success: true,
        orders
    });

});

module.exports = {
    newOrder,
    editOrder,
    completeOrder,
    myOrders,
    adminOrders
};
