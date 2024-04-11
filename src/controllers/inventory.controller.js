const httpStatus = require('http-status');

const {Inventory, InventoryProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkActive, checkDay} = require('./activeDay.controller');

const newInventory = catchAsync(async (req, res) => {

    const activeDay = await checkDay();

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No active day, plz start new day and try again.'
        });
    }

    let products = [];
    let totalPrice = 0;

    const reqProducts = req.body.products;

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findById(reqProduct.id);

        const inventoryProduct = {
            name: product.name,
            quantity: reqProduct.quantity,
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity
        };

        products.push(inventoryProduct);
        totalPrice += inventoryProduct.totalPrice;
    }

    const inventory = await Inventory.create({activeDay: activeDay.id, products, totalPrice});

    if (!inventory) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something went wrong, plz start new day and try again.'
        });
    }

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findById(reqProduct.id);

        product.totalAvailable += parseInt(reqProduct.quantity);
        await product.save({validateBeforeSave: false});
    }


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Inventory recorded successfully.',
        inventory
    });
});

const allInventory = catchAsync(async (req, res) => {

    const inventories = await Inventory.find({});

    let products = [];

    for (let i = 0; i < inventories.length; i++) {
        products.push(inventories[i].products);
    }

    return res.status(httpStatus.OK).json({
        success: true,
        products: products.flat()
    });
});


const dailyInventory = catchAsync(async (req, res) => {

    const dayId = req.params.dayId;
    const activeDay = await checkActive(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No active day, plz start new day and try again.'
        });
    }

    const inventories = await Inventory.find({activeDay: dayId});

    let products = [];

    for (let i = 0; i < inventories.length; i++) {
        products.push(inventories[i].products);
    }

    return res.status(httpStatus.OK).json({
        success: true,
        products: products.flat()
    });
});

module.exports = {
    newInventory,
    allInventory,
    dailyInventory
};
