const httpStatus = require('http-status');

const {Crates} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkStock} = require('./stock.controller');
const {checkDay} = require('./activeDay.controller')

const newCratesRender = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const activeDay = await checkDay(stockId);

    const {products: reqProducts, customerName, customerPhone} = req.body;
    let products = reqProducts.map(p => {
        return {
            id: p.id,
            given: p.given,
            name: p.name,
            remaining: p.given,
        };
    });

    const crates = await Crates.create({products, customerName, customerPhone, stock: stock.id, activeDay: activeDay.id});

    if (!crates) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Crates Recorded Successfully.',
    });
});

const allCrates = catchAsync(async (req, res) => {

    const crates = await Crates.find({allReturned: req.query.given, stock: req.query.stockId});

    return res.status(httpStatus.OK).json({
        success: true,
        crates
    });
});

const returnCrates = catchAsync(async (req, res) => {
    const cratesOrder = await Crates.findById(req.params.id);
    if (!cratesOrder) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Crates Order Not Found.',
        });
    }

    const {products} = req.body;
    const crates = cratesOrder.products;

    let updatedCrates = [];
    let allReturned = true;

    for (let crate of crates) {
        const product = products.find(p => p.id === crate.id);
        if (product) {
            let updtC = {
                id: crate.id,
                name: crate.name,
                given: crate.given,
                returned: parseInt(crate.returned) + parseInt(product.number),
                remaining: parseInt(crate.given) - parseInt(parseInt(crate.returned) + parseInt(product.number))
            };
            updatedCrates.push(updtC);
        } else {
            updatedCrates.push(crate);
        }
    }

    const upc = updatedCrates.filter(c => c.remaining > 0);
    if (upc.length > 0) allReturned = false;

    cratesOrder.products = updatedCrates;
    cratesOrder.allReturned = allReturned;

    await cratesOrder.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Crates Were Returned Successfully.'
    });
});



module.exports = {
    newCratesRender,
    allCrates,
    returnCrates
};
