const httpStatus = require('http-status');

const {Producer, Product} = require('../models');
const catchAsync = require('../utils/catchAsync');


const newProducts = catchAsync(async (req, res) => {

    const producerId = req.query.producerId;
    const producer = await Producer.findById(producerId);
    if (!producer) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Producer Not Found.'
        });
    }

    const {products} = req.body;
    let _products = [];
    for (let p of products) {
        if (p.name) {
            const productName = p.name.replace(/\s/g, '').toLowerCase();
            _products.push({productName, name: p.name, producer: producer.id, price: p.price});
        }
    }
    for (let p of _products) {
        const product = await Product.findOne({productName: p.productName, producer: producer.id});
        if (product) {
            continue;
        }
        await Product.create(p);
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: `${products.length > 0 ? 'Products Added Successfully.' : 'Product Added Successfully.'}`
    });

});

const editProduct = catchAsync(async (req, res) => {

    const product = await Product.findById(req.params.productId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Not Found.',
        });
    }

    const {name, price} = req.body;
    const productName = name.replace(/\s/g, '').toLowerCase();
    const _product = await Product.findOne({productName, producer: product.producer});

    if (_product && _product.id !== product.id) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Already Exists.',
        });
    }

    const pName = name ? name : product.name;
    const pPrice = price ? price : product.price;
    product.name = pName;
    product.price = pPrice;

    await product.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Product Edited Successfully.',
    });

});

const allProducts = catchAsync(async (req, res) => {
    const products = await Product.find({producer: req.query.producerId});

    return res.status(httpStatus.OK).json({
        success: true,
        products
    });
});



module.exports = {
    newProducts,
    editProduct,
    allProducts
};
