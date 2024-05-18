const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct, Product} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkStock} = require('./stock.controller');
const {getEntityById} = require('./sales.controller');


const newProduct = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const {products} = req.body;

    for (let p of products) {
        const product = await InventoryProduct.findById(p.productId);
        if (!product) {
            continue;
        }
        const existingProduct = await SalesProduct.findOne({inventoryProduct: product.id});
        if (existingProduct) {
            continue;
        }
        await SalesProduct.create({inventoryProduct: product.id, price: p.price, stock: stock.id});
    }


    return res.status(httpStatus.CREATED).json({
        success: true,
        message: `${products.length > 0 ? 'Products Added Successfully.' : 'Product Added Successfully.'}`
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
    const entity = await getEntityById(req.query.entityType, req.query.entityId);
    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    const products = await SalesProduct.find({[req.query.entityType]: req.query.entityId});
    let resProducts = [];

    for (let i = 0; i < products.length; i++) {
        const ip = await InventoryProduct.findById(products[i].inventoryProduct);
        const product = await Product.findOne({productName: ip.productName})
        resProducts.push({
            name: ip.name,
            price: products[i].price,
            id: products[i]._id,
            inventoryProduct: ip.id,
            producer: product?.producer
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
            resProducts.push({
                name: products[i].inventoryProduct.name,
                price: products[i].price,
                id: products[i]._id,
                number: products[i].inventoryProduct.totalAvailable,
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
