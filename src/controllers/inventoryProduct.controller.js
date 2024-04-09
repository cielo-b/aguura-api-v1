const httpStatus = require('http-status');

const {InventoryProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');


const newProduct = catchAsync(async (req, res) => {

    const {name, price} = req.body;
    const productName = name.replace(/\s/g, '').toLowerCase();

    const product = await InventoryProduct.find({productName});

    if (product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product already exist.',
        });
    }

    const newProduct = await InventoryProduct.create({name, price});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Product created successfully.',
        product: newProduct
    });

});


const editProduct = catchAsync(async (req, res) => {

    const product = await InventoryProduct.findById(req.params.productId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product not found.',
        });
    }


    const {name, price} = req.body;
    const productName = name.replace(/\s/g, '').toLowerCase();

    const existingProduct = await InventoryProduct.find({productName});

    if (existingProduct) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product already exist.',
        });
    }

    const pName = name ? name : product.name;
    const pPrice = price ? price : product.price;

    product.name = pName;
    product.price = pPrice;

    await product.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Product edited successfully.',
        product
    });

});

const allProducts = catchAsync(async (req, res) => {
    const products = await InventoryProduct.find({}, {productName: 0});

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
