const httpStatus = require('http-status');

const {Inventory, InventoryProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkActive, checkDay} = require('./activeDay.controller');
const {checkStock} = require('./stock.controller');
const formatNumber = require('../utils/formatNumber');

const newInventory = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const activeDay = await checkDay(stock.id);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }

    let products = [];
    let totalPrice = 0;
    let description = ``;

    const reqProducts = req.body.products;

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findById(reqProduct.id);

        const inventoryProduct = {
            name: product.name,
            quantity: parseFloat(reqProduct.quantity).toFixed(2),
            unitPrice: product.price,
            totalPrice: product.price * parseFloat(reqProduct.quantity).toFixed(2),
            id: product.id
        };

        products.push(inventoryProduct);
        totalPrice += inventoryProduct.totalPrice;
        description = description + `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
    }

    const inventory = await Inventory.create({activeDay: activeDay.id, products, totalPrice, stock: stock.id, description});

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

        product.totalAvailable = parseFloat(product.totalAvailable) + parseFloat(reqProduct.quantity);
        product.dailyAdded = parseFloat(product.dailyAdded) + parseFloat(reqProduct.quantity);
        await product.save({validateBeforeSave: false});
    }


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Inventory Recorded Successfully.',
        inventory
    });
});


const editInventory = catchAsync(async (req, res) => {

    const inventoryId = req.query.inventoryId;
    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    let products = [];
    let totalPrice = 0;
    let description = ``;
    let initials = [];

    const iProducts = inventory.products;
    for (let p of iProducts) {
        initials.push({
            id: p.id,
            quantity: p.quantity
        });
    }

    const reqProducts = req.body.products;

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findById(reqProduct.id);

        const inventoryProduct = {
            name: product.name,
            quantity: parseFloat(reqProduct.quantity).toFixed(2),
            unitPrice: product.price,
            totalPrice: product.price * parseFloat(reqProduct.quantity).toFixed(2),
            id: product.id
        };

        products.push(inventoryProduct);
        totalPrice += inventoryProduct.totalPrice;
        description = description + `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
    }

    inventory.products = products;
    inventory.totalPrice = totalPrice;
    inventory.description = description;
    await inventory.save({validateBeforeSave: false});

    if (!inventory) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }

    for (let i = 0; i < initials.length; i++) {
        let iP = initials[i];
        if (iP) {
            let p = await InventoryProduct.findById(iP.id);
            p.totalAvailable -= parseFloat(iP.quantity); // Subtract without converting to strings
            p.dailyAdded -= parseFloat(iP.quantity); // Subtract without converting to strings
            await p.save({validateBeforeSave: false});
        }
    }

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findById(reqProduct.id);

        product.totalAvailable += parseFloat(reqProduct.quantity); // Add without converting to strings
        product.dailyAdded += parseFloat(reqProduct.quantity); // Add without converting to strings
        await product.save({validateBeforeSave: false});
    }

    if (inventory.products.length === 0) {
        await inventory.deleteOne();
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Inventory Edited Successfully.',
    });
});

const allInventory = catchAsync(async (req, res) => {

    const inventories = await Inventory.find({stock: req.query.stockId});

    return res.status(httpStatus.OK).json({
        success: true,
        inventories
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

    return res.status(httpStatus.OK).json({
        success: true,
        inventories
    });
});

const inventoryStats = catchAsync(async (req, res) => {
    const inventories = await Inventory.find({stock: req.query.stockId}, {activeDay: 0, products: 0});

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
    editInventory,
    allInventory,
    dailyInventory,
    inventoryStats
};
