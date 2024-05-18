const httpStatus = require('http-status');

const {User, DistributionPoint, InventoryProduct, ActiveDay, Stock, SalesProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {userService, tokenService} = require('../services');


const newDistributionPoint = catchAsync(async (req, res) => {

    const {name, location, fullName, phone, password} = req.body;

    if (await User.isPhoneTaken(phone)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Phone Already Taken.'
        });
    }

    const admin = await userService.createUser({fullName, phone, password, role: 'distributor', monthlyPayment: parseFloat('75')});

    if (!admin) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Failed To Register, Plz Try Again.',
        });
    }

    const distributionPoint = await DistributionPoint.create({manager: admin.id, location, name});
    const tokens = await tokenService.generateAuthTokens(admin);

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Registered Successfully.',
        distributionPoint,
        user: admin,
        tokens
    });

});


const editDistributionPoint = catchAsync(async (req, res) => {

    const distributionPoint = await DistributionPoint.findById(req.params.distributionPointId);

    if (!distributionPoint) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Not Found.',
        });
    }

    const {name, fullName, phone, password, location} = req.body;

    const manager = await User.findById(distributionPoint.manager);
    manager.fullName = fullName;
    manager.phone = phone;
    if (password) manager.password = password;
    await manager.save({validateBeforeSave: false});

    const distributionPointName = name ? name : distributionPoint.name;
    const distributionPointLocation = location ? location : distributionPoint.location;
    distributionPoint.name = distributionPointName;
    distributionPoint.location = distributionPointLocation;

    await distributionPoint.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Edited Successfully.',
    });
});


const getPointByManager = catchAsync(async (req, res) => {
    let distributionPoint = await DistributionPoint.findOne({manager: req.query.managerId});
    const activeDay = await ActiveDay.findOne({distributionPoint: distributionPoint.id, isActive: true});

    return res.status(httpStatus.OK).json({
        success: true,
        distributionPoint,
        activeDay
    });
});

const getAllDistributionPoints = catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'User Not Found.'
        });
    }

    let distributionPoints = await DistributionPoint.find({});

    distributionPoints = await Promise.all(distributionPoints.map(async (distributionPoint) => {

        let products = await InventoryProduct.find({distributionPoint: distributionPoint.id, totalAvailable: {$gt: 0}});

        products = Promise.all(products.map(async p => {
            const saleProduct = await SalesProduct.findOne({inventoryProduct: p._id});
            if (saleProduct) {
                return {
                    name: p.name,
                    id: p._id,
                    total: p.totalAvailable,
                    price: saleProduct.price,
                    totalAvailable: p.totalAvailable
                };
            }
        }));

        return {
            managerName: distributionPoint.manager.fullName,
            managerPhone: distributionPoint.manager.phone,
            location: distributionPoint.location,
            id: distributionPoint.id,
            name: distributionPoint.name,
            products
        };
    }));

    return res.status(httpStatus.OK).json({
        success: true,
        distributionPoints
    });
});


const getDistributionPoint = catchAsync(async (req, res) => {

    const distributionPoint = await DistributionPoint.findById(req.query.distributionPointId);
    if (!distributionPoint) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Not Found.'
        });
    }
    let products = await InventoryProduct.find({distributionPoint: distributionPoint.id, totalAvailable: {$gt: 0}});

    products = products.map(p => {
        return {
            name: p.name,
            id: p._id,
            total: p.totalAvailable
        };
    });

    return res.status(httpStatus.OK).json({
        success: true,
        distributionPoint: {
            ...distributionPoint.toObject(),
            products
        }
    });
});

const fetchStockDetails = async (stocks) => {
    return Promise.all(stocks.map(async (stock) => {
        const stockDetails = await Stock.findById(stock.id).populate('admin');
        return {
            name: stockDetails.name,
            managerPhone: stockDetails.admin.phone,
            managerName: stockDetails.admin.fullName,
            totalPurchases: stock.totalPurchases,
            id: stock.id,
            location: stockDetails.location,
        };
    }));
};

const getStocks = catchAsync(async (req, res) => {
    const distributionPointId = req.query.distributionPointId;
    const distributionPoint = await DistributionPoint.findById(distributionPointId);

    if (!distributionPoint) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Distribution point not found.'
        });
    }

    const stocks = await fetchStockDetails(distributionPoint.stocks);

    return res.status(httpStatus.OK).json({
        success: true,
        stocks
    });
});




module.exports = {
    newDistributionPoint,
    editDistributionPoint,
    getPointByManager,
    getDistributionPoint,
    getAllDistributionPoints,
    getStocks,
    fetchStockDetails
};
