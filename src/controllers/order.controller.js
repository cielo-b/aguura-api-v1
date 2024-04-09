const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct, Sales, Credit, User, Order, ActiveDay} = require('../models');
const catchAsync = require('../utils/catchAsync');

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
    }

    const order = await Order.create({totalPrice, products});

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
        description = description + `${salesProduct.name}: ${salesProduct.quantity} x ${salesProduct.unitPrice} = ${salesProduct.totalPrice} \n`;
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

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User not found.'
        });
    }

    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Order not found.'
        });
    }

    const activeDay = await ActiveDay.find({isActive: true});

    const {isFullyPaid, amountPaid} = req.body;

    // handle amount
    let amount = isFullyPaid ? order.totalPrice : amountPaid;

    const sales = await Sales.create({activeDay: activeDay.id, products: order.products, totalPrice: order.totalPrice, isFullyPaid, customerName: customer.fullName, customerPhone: customer.phone, amountPaid: amount, description: order.description});

    if (!sales) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something went wrong, plz try again.'
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
    if (!isFullyPaid) {
        const credit = await Credit.create({sales: sales.id, totalAmount: totalPrice - amountPaid});

        if (!credit) {
            return res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Order Completed successfully but, credit failed to be recorder.',
            });
        }
    }

    order.isCompleted = true;
    await order.save({validateBeforeSave: false});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Order completed successfully.',
    });
});


const myOrders = catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User not found.'
        });
    }

    const orders = await Order.find({customer: user.id}, {products: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        orders
    });

});

const adminOrders = catchAsync(async (req, res) => {

    const orders = await Order.find({isCompleted: req.query.isCompleted}, {products: 0});

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
