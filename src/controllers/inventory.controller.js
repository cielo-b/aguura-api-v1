const httpStatus = require('http-status');

const {Inventory, InventoryProduct, Product, User, DistributionPoint, Stock, Producer} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkDay} = require('./activeDay.controller');
const formatNumber = require('../utils/formatNumber');
const {getEntityById} = require('./sales.controller');
const {ebmService} = require('../services');


const generateEBMRequestData = (products, manager, entity) => {

    let itemList = [];
    let totalTxAmt = 0;
    let totalPrice = 0;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        itemList.push({
            itemSeq: i + 1,
            itemCd: product.itemCd,
            itemClsCd: product.itemClsCd,
            itemNm: product.name,
            bcd: null,
            pkgUnitCd: product.pkgUnitCd,
            pkg: product.quantity,
            qtyUnitCd: product.qtyUnitCd,
            qty: product.quantity,
            itemExprDt: null,
            prc: product.unitPrice,
            splyAmt: product.totalPrice,
            totDcAmt: 0,
            taxblAmt: product.totalPrice,
            taxTyCd: "B",
            taxAmt: ((18 / 118) * product.totalPrice).toFixed(2),
            totAmt: product.totalPrice
        });

        totalTxAmt = parseFloat(totalTxAmt) + parseFloat(((18 / 118) * product.totalPrice).toFixed(2));
        totalPrice += product.totalPrice;
    }

    const data = {
        tin: manager.tin,
        bhfId: manager.bhfId,
        sarNo: itemList.length,
        orgSarNo: 0,
        regTyCd: "M",
        custTin: null,
        custNm: null,
        custBhfId: null,
        sarTyCd: "02",
        ocrnDt: ebmService.customReqDate().slice(0, 8),
        totItemCnt: itemList.length,
        totTaxblAmt: totalPrice,
        totTaxAmt: (totalTxAmt).toFixed(2),
        totAmt: (parseFloat(totalPrice) - parseFloat(totalTxAmt)).toFixed(2),
        remark: null,
        regrId: entity.id.slice(0, 20),
        regrNm: entity.name,
        modrNm: manager.fullName,
        modrId: manager.id.slice(0, 20),
        itemList
    };

    return data;
};

const generateStockMasterRequestData = (manager, product, entity) => {
    const data = {
        tin: manager.tin,
        bhfId: manager.bhfId,
        itemCd: product.itemCd,
        rsdQty: product.totalAvailable,
        regrId: entity.id.slice(0, 20),
        regrNm: entity.name,
        modrNm: manager.fullName,
        modrId: manager.id.slice(0, 20),
    };

    return data;
};

const newInventory = catchAsync(async (req, res) => {

    const {entityType, entityId, products: reqProducts, dayId, ebmUpdated} = req.body;

    let entity = await getEntityById(entityType, entityId);
    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    const manager = await User.findById(entityType === 'stock' ? entity.admin : entity.manager);

    const activeDay = await checkDay({entityType, entityId});
    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }
    if (activeDay.id.toString() !== dayId.toString()) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Active Days Mismatching.'
        });
    }


    let products = [];
    let totalPrice = 0;
    let description = ``;

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = entityType === 'producer' ? await Product.findById(reqProduct.id) : await InventoryProduct.findById(reqProduct.id);

        const inventoryProduct = {
            name: product.name,
            quantity: parseFloat(reqProduct.quantity),
            unitPrice: product.price,
            totalPrice: product.price * parseFloat(reqProduct.quantity),
            id: product.id,
            itemCd: product.itemCd,
            itemClsCd: product.itemClsCd,
            itemTyCd: product.itemTyCd,
            orgnNatCd: product.orgnNatCd,
            pkgUnitCd: product.pkgUnitCd,
            qtyUnitCd: product.qtyUnitCd
        };

        products.push(inventoryProduct);
        totalPrice += inventoryProduct.totalPrice;
        description = description + `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
    }

    const inventory = await Inventory.create({activeDay: activeDay.id, products, totalPrice, [entityType]: entityId, description});

    if (!inventory) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = entityType === 'producer' ? await Product.findById(reqProduct.id) : await InventoryProduct.findById(reqProduct.id);

        product.totalAvailable += parseFloat(reqProduct.quantity);
        product.dailyAdded += parseFloat(reqProduct.quantity);
        await product.save({validateBeforeSave: false});
    }

    if (manager.country === 'rwanda' && !ebmUpdated) {
        // update ebm products 

        const data = generateEBMRequestData(products, manager, entity);

        const response = await ebmService.saveStockItems(data);

        if (response.resultCd !== '000') {
            return res.status(httpStatus.CREATED).json({
                success: false,
                message: 'Inventory Recorded Into Aguura But Failed Into EBM, Plz Delete This Inventory And Try Again.',
            });
        } else {
            // update stock Items master
            for (let i = 0; i < products.length; i++) {

                const product = products[i];
                const p = entityType === 'producer' ?
                    await Product.findById(product.id) :
                    await InventoryProduct.findById(product.id);

                const reqData = generateStockMasterRequestData(manager, p, entity);
                const response = await ebmService.stockItemsMaster(reqData);

                console.log(response);
            }
        }
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
    const ebmUpdated = req.body.ebmUpdated;

    if (!inventory) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    let entityType = inventory.producer ? 'producer' : inventory.distributionPoint ? 'distributionPoint' : 'stock';
    let entity = inventory.producer ? await Producer.findById(inventory.producer) :
        inventory.distributionPoint ? await DistributionPoint.findById(inventory.distributionPoint) :
            await Stock.findById(inventory.stock);

    let manager = await User.findById(entityType === 'stock' ? entity.admin : entity.manager);

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
        let product = entityType === 'producer' ? await Product.findById(reqProduct.id) : await InventoryProduct.findById(reqProduct.id);

        const inventoryProduct = {
            name: product.name,
            quantity: parseFloat(reqProduct.quantity).toFixed(2),
            unitPrice: product.price,
            totalPrice: product.price * parseFloat(reqProduct.quantity).toFixed(2),
            id: product.id,
            itemCd: product.itemCd,
            itemClsCd: product.itemClsCd,
            itemTyCd: product.itemTyCd,
            orgnNatCd: product.orgnNatCd,
            pkgUnitCd: product.pkgUnitCd,
            qtyUnitCd: product.qtyUnitCd
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
            let p = entityType === 'producer' ? await Product.findById(iP.id) : await InventoryProduct.findById(iP.id);
            p.totalAvailable -= parseFloat(iP.quantity);
            p.dailyAdded -= parseFloat(iP.quantity);
            await p.save({validateBeforeSave: false});
        }
    }

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = entityType === 'producer' ? await Product.findById(reqProduct.id) : await InventoryProduct.findById(reqProduct.id);
        product.totalAvailable += parseFloat(reqProduct.quantity);
        product.dailyAdded += parseFloat(reqProduct.quantity);
        await product.save({validateBeforeSave: false});
    }

    if (inventory.products.length === 0) {
        await inventory.deleteOne();
    } else {
        if (manager.country === 'rwanda' && !ebmUpdated) {

            const data = generateEBMRequestData(products, manager, entity);

            const response = await ebmService.saveStockItems(data);
            console.log(response);

            if (response.resultCd !== '000') {
                return res.status(httpStatus.CREATED).json({
                    success: false,
                    message: 'Inventory Recorded Into Aguura But Failed Into EBM, Plz Delete This Inventory And Try Again.',
                });
            } else {
                // update stock Items master
                for (let i = 0; i < products.length; i++) {

                    const product = products[i];
                    const p = entityType === 'producer' ?
                        await Product.findById(product.id) :
                        await InventoryProduct.findById(product.id);

                    const reqData = generateStockMasterRequestData(manager, p, entity);
                    const response = await ebmService.stockItemsMaster(reqData);

                    console.log(response);
                }
            }
        }
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Inventory Edited Successfully.',
    });
});

const allInventory = catchAsync(async (req, res) => {
    const {entityType, entityId} = req.query;

    let entity = await getEntityById(entityType, entityId);

    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    const inventories = await Inventory.find({[entityType]: entityId});

    return res.status(httpStatus.OK).json({
        success: true,
        inventories
    });
});


const dailyInventory = catchAsync(async (req, res) => {

    const {entityId, entityType, dayId} = req.query;

    let entity = await getEntityById(entityType, entityId);

    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }
    const inventories = await Inventory.find({[entityType]: entityId, activeDay: dayId});

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
    inventoryStats,
};
