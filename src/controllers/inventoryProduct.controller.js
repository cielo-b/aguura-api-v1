const httpStatus = require('http-status');

const {InventoryProduct} = require('../models');
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

    const {name, price, company} = req.body;
    const productName = name.replace(/\s/g, '').toLowerCase();

    const product = await InventoryProduct.findOne({productName, stock: stock.id});

    if (product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Already Exist.',
        });
    }

    const newProduct = await InventoryProduct.create({name, price, productName, company, stock: stock.id});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Product Added Successfully.',
        product: newProduct
    });

});


const editProduct = catchAsync(async (req, res) => {

    const product = await InventoryProduct.findById(req.params.productId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Not Found.',
        });
    }


    const {name, price, company} = req.body;
    const productName = name.replace(/\s/g, '').toLowerCase();

    const pName = name ? name : product.name;
    const pPrice = price ? price : product.price;
    const pCompany = company ? company : product.company;

    product.name = pName;
    product.price = pPrice;
    product.productName = productName;
    product.company = pCompany;

    await product.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Product Edited Successfully.',
        product
    });

});

const allProducts = catchAsync(async (req, res) => {
    const products = await InventoryProduct.find({stock: req.query.stockId}, {productName: 0}).populate('company');

    return res.status(httpStatus.OK).json({
        success: true,
        products
    });
});



module.exports = {
    newProduct,
    editProduct,
    allProducts
};
