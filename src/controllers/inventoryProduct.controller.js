const httpStatus = require('http-status');

const {InventoryProduct, Product, DistributionPoint, Producer, SalesProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkStock} = require('./stock.controller');


// ========= Distributor Products =========

const addDistributorProducts = catchAsync(async (req, res) => {

    const distributorId = req.query.distributorId;
    const distributionPoint = await DistributionPoint.findById(distributorId);

    if (!distributionPoint) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Distribution Point Not Found.'
        });
    }

    const {products, isByProducer} = req.body;
    let producers = [];
    let _products = [];
    for (let p of products) {
        const productName = p.name.replace(/\s/g, '').toLowerCase();
        if (isByProducer) {
            const product = await Product.findById(p.productId);
            if (product) {
                producers.push(product.producer);
                _products.push({productName, name: product.name, product: product.id, price: product.price, salePrice: p.price, distributionPoint: distributionPoint.id});
            }
        } else {
            _products.push({productName, name: p.name, price: p.purchasePrice, salePrice: p.price, distributionPoint: distributionPoint.id});
        }
    }
    for (let p of _products) {
        const product = await InventoryProduct.findOne({productName: p.productName, distributionPoint: distributionPoint.id});
        if (product) {
            continue;
        }
        const iP = await InventoryProduct.create(p);
        if (iP) {
            await SalesProduct.create({distributionPoint: distributionPoint.id, price: p.salePrice, inventoryProduct: iP.id});
        }
    }

    producers = Array.from(new Set(producers));
    for (let p of producers) {
        const producer = await Producer.findById(p);
        if (producer) {
            let distributionPoints = producer.distributionPoints;
            if (!distributionPoints.some(dp => dp.id.equals(distributionPoint.id))) {
                distributionPoints.push({id: distributionPoint.id, totalOrders: parseFloat('0')});
            }
            await producer.save({validateBeforeSave: false});
        }
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: `${products.length > 0 ? 'Products Added Successfully.' : 'Product Added Successfully.'}`
    });
});

const getDistributorProducts = catchAsync(async (req, res) => {

    const distributorId = req.query.distributorId;
    const distributionPoint = await DistributionPoint.findById(distributorId);

    if (!distributionPoint) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Distribution Point Not Found.'
        });
    }

    let products = await InventoryProduct.find({distributionPoint: distributionPoint.id});
    products = await Promise.all(products.map(async (p) => {
        const product = await Product.findById(p.product);
        const saleProduct = await SalesProduct.findOne({inventoryProduct: p._id});
        return {
            id: p.id,
            name: p.name,
            price: p.price,
            producer: product?.producer,
            totalAvailable: p.totalAvailable,
            productName: p.productName,
            sellingPrice: saleProduct?.price
        };
    }));

    return res.status(httpStatus.CREATED).json({
        success: true,
        products
    });
});


// ========= Stock Products =========

const addStockProducts = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const {products, isByProducer} = req.body;
    let _products = [];
    let producers = [];
    for (let p of products) {
        const productName = p.name.replace(/\s/g, '').toLowerCase();
        if (isByProducer) {
            const product = await InventoryProduct.findById(p.productId);
            const saleProduct = await SalesProduct.findOne({inventoryProduct: product.id});
            if (product) {
                producers.push(product.producer);
                _products.push({productName, name: product.name, product: product.id, salePrice: p.price, price: saleProduct.price, stock: stock.id});
            }
        } else {
            _products.push({productName, name: p.name, salePrice: p.price, price: p.purchasePrice, stock: stock.id});
        }
    }
    for (let p of _products) {
        const product = await InventoryProduct.findOne({productName: p.productName, stock: stock.id});
        if (product) {
            continue;
        }
        const iP = await InventoryProduct.create(p);
        if (iP) {
            await SalesProduct.create({stock: stock.id, price: p.salePrice, inventoryProduct: iP.id});
        }
    }

    producers = Array.from(new Set(producers));
    for (let p of producers) {
        const producer = await Producer.findById(p);
        if (producer) {
            let stocks = producer.stocks;
            if (!stocks.some(dp => dp.id.equals(stock.id))) {
                stocks.push({id: stock.id, totalOrders: parseFloat('0')});
            }
            await producer.save({validateBeforeSave: false});
        }
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: `${products.length > 0 ? 'Products Added Successfully.' : 'Product Added Successfully.'}`
    });
});

const getStockProducts = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    let products = await InventoryProduct.find({stock: stock.id});
    products = await Promise.all(products.map(async (p) => {
        const product = await Product.findOne({productName: p.productName});
        return {
            id: p._id,
            name: p.name,
            price: p.price,
            producer: product?.producer,
            totalAvailable: p.totalAvailable
        };
    }));

    return res.status(httpStatus.CREATED).json({
        success: true,
        products
    });
});


// ============================================================================================

const editProduct = catchAsync(async (req, res) => {

    const product = await InventoryProduct.findById(req.params.productId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Not Found.',
        });
    }

    const {name, price} = req.body;
    const pPrice = price ? price : product.price;
    const pName = name ? name : product.name;
    product.price = pPrice;
    product.name = pName;

    await product.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Product Edited Successfully.',
        product
    });

});



const allProducts = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    let products = await InventoryProduct.find({stock: stock.id});
    products = await Promise.all(products.map(async (p) => {
        const product = await Product.findById(p.product);
        return {
            id: p._id,
            name: p.name,
            price: p.price,
            producer: product?.producer,
            totalAvailable: p.totalAvailable
        };
    }));

    return res.status(httpStatus.CREATED).json({
        success: true,
        products
    });
});



module.exports = {
    addDistributorProducts,
    getDistributorProducts,
    addStockProducts,
    getStockProducts,
    editProduct,
    allProducts
};
