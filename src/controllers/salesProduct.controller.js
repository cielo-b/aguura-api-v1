const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');


const newProduct = catchAsync(async (req, res) => {

    const {inventoryProductId, price} = req.body;

    const product = await InventoryProduct.findById(inventoryProductId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product not found.',
        });
    }

    const existingProduct = await SalesProduct.findOne({inventoryProduct: inventoryProductId});
    if (existingProduct) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product already exist.',
        });
    }

    const newProduct = await SalesProduct.create({inventoryProduct: inventoryProductId, price});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Product created successfully.',
        product: newProduct
    });

});


const editProduct = catchAsync(async (req, res) => {

    const product = await SalesProduct.findById(req.params.productId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product not found.',
        });
    }

    const {price} = req.body;

    product.price = price;

    await product.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Product edited successfully.',
        product
    });

});

const allProducts = catchAsync(async (req, res) => {
    const products = await SalesProduct.find({}).populate('inventoryProduct');
    let resProducts = [];

    for (let i = 0; i < products.length; i++) {
        resProducts.push({
            name: products[i].inventoryProduct.name,
            price: products[i].price,
            id: products[i]._id
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        products: resProducts
    });
});

const availableProducts = catchAsync(async (req, res) => {

    const products = await SalesProduct.find({}).populate('inventoryProduct');
    let resProducts = [];

    for (let i = 0; i < products.length; i++) {
        if (products[i].inventoryProduct.totalAvailable > 0) {
            resProducts.push({
                name: products[i].inventoryProduct.name,
                price: products[i].price,
                id: products[i]._id
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
