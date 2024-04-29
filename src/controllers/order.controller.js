const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct, Sales, Credit, User, Order, Payment, PaymentMethod} = require('../models');
const catchAsync = require('../utils/catchAsync');
const formatNumber = require('../utils/formatNumber');
const {checkDay} = require('./activeDay.controller');
const {checkStock} = require('./stock.controller');
const sendPushNotification = require('../utils/fcmSendPushNotifications');

const newOrder = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const {products: reqProducts} = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
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
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity
        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description = description + `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;

    }

    const order = await Order.create({totalPrice, products, description, customer: user.id, stock: stock.id});

    if (!order) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }

    // send notification to admin
    const adminUser = await User.findById(stock.admin);
    if (adminUser) {
        const title = 'New Order';
        const body = `\n\nHello ${adminUser.fullName} 👋\nYou have new order from ${user.fullName}`;
        sendPushNotification(adminUser.fcmToken, title, body);
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Order Sent Successfully.',
    });

});

const editOrder = catchAsync(async (req, res) => {

    const {products: reqProducts} = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Order Not Found.'
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
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity
        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description = description + `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} \n`;
    }

    order.products = products;
    order.totalPrice = totalPrice;
    order.description = description;

    await order.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Order Was Edited Successfully.',
    });

});

const completeOrder = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Order Not Found.'
        });
    }

    const activeDay = await checkDay(stock.id);

    const {amountPaid, payments, isFullyPaying} = req.body;

    if (!isFullyPaying && !amountPaid) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Add How Much User Paid.'
        });
    }

    if (amountPaid > 0) {
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
            if (parseInt(total) !== parseInt(amountPaid)) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
                });
            }
        }
    }

    if (isFullyPaying && (amountPaid !== order.totalPrice)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: `Amount Has To Be ${formatNumber(order.totalPrice)} Rwf`
        });
    }

    // handle amount
    let paid = order.totalPrice === amountPaid;

    const sales = await Sales.create({activeDay: activeDay.id, products: order.products, totalPrice: order.totalPrice, isFullyPaid: paid, customerName: order.customer.fullName, customerPhone: order.customer.phone, amountPaid, description: order.description, stock: req.query.stockId});

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

        inventoryProduct.totalAvailable = (parseInt(inventoryProduct.totalAvailable) - parseInt(reqProduct.quantity));
        await inventoryProduct.save({validateBeforeSave: false});
    }

    // if not fully paid, create new credit
    if (!paid) {
        const credit = await Credit.create({activeDay: activeDay.id, sales: sales.id, totalAmount: order.totalPrice - amountPaid, customerName: order.customer.fullName, description: order.description, stock: stock.id});

        if (!credit) {
            return res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Order Completed Successfully But, Credit Failed To Be Recorder.',
            });
        }
    }

    if (payments.length > 0) {
        for (const payment of payments) {
            let method = await PaymentMethod.findById(payment.id);
            const p = await Payment.create({activeDay: activeDay.id, method: method.id, customerName: order.customer.fullName, customerPhone: order.customer.phone, amount: payment.amount, stock: stock.id});
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

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const orders = await Order.find({customer: user.id, stock: req.query.stockId});

    return res.status(httpStatus.OK).json({
        success: true,
        orders
    });

});

const adminOrders = catchAsync(async (req, res) => {

    let orders = await Order.find({isCompleted: req.query.isCompleted, stock: req.query.stockId}, {products: 0}).populate('customer');
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
