const httpStatus = require('http-status');

const {Inventory, InventoryProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkActive, checkDay} = require('./activeDay.controller');

const newInventory = catchAsync(async (req, res) => {

    const activeDay = await checkDay();

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
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
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findById(reqProduct.id);

        product.totalAvailable += parseInt(reqProduct.quantity);
        product.dailyAdded += parseInt(reqProduct.quantity);
        await product.save({validateBeforeSave: false});
    }


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Inventory Recorded Successfully.',
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
        inventories: products.flat()
    });
});


const dailyInventory = catchAsync(async (req, res) => {

    const dayId = req.params.dayId;
    const activeDay = await checkActive(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }

    const inventories = await Inventory.find({activeDay: dayId});

    let products = [];

    for (let i = 0; i < inventories.length; i++) {
        products.push(inventories[i].products);
    }

    return res.status(httpStatus.OK).json({
        success: true,
        inventories: products.flat()
    });
});

const inventoryStats = catchAsync(async (req, res) => {
    const inventories = await Inventory.find({}, {activeDay: 0, products: 0});

    let totalInventory = 0;
    let totalAmount = 0;

    inventories.forEach(i => {
        totalInventory++;
        totalAmount += i.totalPrice;
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stats: {
            totalInventory,
            totalAmount
        }
    });
});

module.exports = {
    newInventory,
    allInventory,
    dailyInventory,
    inventoryStats
};
