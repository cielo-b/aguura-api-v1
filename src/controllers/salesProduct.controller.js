const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct, Company} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkStock} = require('./stock.controller');


const newProduct = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const {inventoryProductId, price} = req.body;

    const product = await InventoryProduct.findById(inventoryProductId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Not Found.',
        });
    }

    const existingProduct = await SalesProduct.findOne({inventoryProduct: inventoryProductId});
    if (existingProduct) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Already Exist.',
        });
    }

    const newProduct = await SalesProduct.create({inventoryProduct: inventoryProductId, price, stock: stock.id});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Product Added Successfully.',
        product: newProduct
    });

});


const editProduct = catchAsync(async (req, res) => {

    const product = await SalesProduct.findById(req.params.productId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Not Found.',
        });
    }

    const {price} = req.body;

    product.price = price;

    await product.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Product Edited Successfully.',
        product
    });

});

const allProducts = catchAsync(async (req, res) => {
    const products = await SalesProduct.find({stock: req.query.stockId}).populate('inventoryProduct');
    let resProducts = [];

    for (let i = 0; i < products.length; i++) {
        const company = await Company.findById(products[i].inventoryProduct.company);
        resProducts.push({
            name: products[i].inventoryProduct.name,
            price: products[i].price,
            id: products[i]._id,
            company: company?.name
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        products: resProducts
    });
});

const availableProducts = catchAsync(async (req, res) => {

    const products = await SalesProduct.find({stock: req.query.stockId}).populate('inventoryProduct');
    let resProducts = [];

    for (let i = 0; i < products.length; i++) {
        if (parseInt(products[i].inventoryProduct.totalAvailable) > 0) {
            const company = await Company.findById(products[i].inventoryProduct.company);
            resProducts.push({
                name: products[i].inventoryProduct.name,
                price: products[i].price,
                id: products[i]._id,
                number: products[i].inventoryProduct.totalAvailable,
                company: company.name
            });
        }
    }

    return res.status(httpStatus.OK).json({
        success: true,
        products: resProducts
    });
});



module.exports = {
    newProduct,
    editProduct,
    allProducts,
    availableProducts
};
