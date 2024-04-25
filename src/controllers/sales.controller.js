const httpStatus = require('http-status');

const {InventoryProduct, SalesProduct, Sales, Credit, PaymentMethod, Payment} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkActive, checkDay} = require('./activeDay.controller');
const formatNumber = require('../utils/formatNumber');
const {checkStock} = require('./stock.controller');

const newSales = catchAsync(async (req, res) => {
    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const activeDay = await checkDay(stockId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }

    const {products: reqProducts, isFullyPaid, customerName, customerPhone, amountPaid, payments} = req.body;

    if (!isFullyPaid && !amountPaid) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Add How Much User Paid.'
        });
    }

    if (isFullyPaid && payments.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Add How User Paid.'
        });
    }

    if (amountPaid > 0) {
        if (payments.length === 0) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Plz Add How User Paid.'
            });
        } else {
            let total = 0;
            for (const p of payments) {
                total += parseInt(p.amount);
            }
            if (parseInt(total) !== parseInt(amountPaid)) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
                });
            }
        }
    }


    let products = [];
    let _payments = [];
    let totalPrice = 0;
    let description = ``;
    let paymentDescription = ``;

    for (let payment of payments) {
        let method = await PaymentMethod.findById(payment.id);
        const _payment = {
            id: method.id,
            name: method.name,
            amount: payment.amount
        };
        _payments.push(_payment);
        paymentDescription = paymentDescription + `${_payment.name}: ${formatNumber(_payment.amount)} Rwf \n`;
    }

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id).populate('inventoryProduct');

        const salesProduct = {
            name: product.inventoryProduct.name,
            quantity: reqProduct.quantity,
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity,
            id: product.id
        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description = description + `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf \n`;
    }

    // handle amount
    let amount = isFullyPaid ? totalPrice : amountPaid;

    if (isFullyPaid) {
        {
            let total = 0;
            for (const p of payments) {
                total += parseFloat(p.amount);
            }
            if (parseFloat(total) !== parseFloat(amount)) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
                });
            }
        }
    }

    const sales = await Sales.create({stock: stock.id, activeDay: activeDay.id, products, totalPrice, isFullyPaid, customerName, customerPhone, amountPaid: amount, description, paymentDescription, payments: _payments});
    if (!sales) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id);
        let inventoryProduct = await InventoryProduct.findById(product.inventoryProduct);

        inventoryProduct.totalAvailable = (parseFloat(inventoryProduct.totalAvailable) - parseFloat(reqProduct.quantity));
        await inventoryProduct.save({validateBeforeSave: false});
    }

    // if not fully paid, create new credit
    if (!isFullyPaid) {
        const credit = await Credit.create({activeDay: activeDay.id, stock: stock.id, sales: sales.id, totalAmount: totalPrice - amountPaid, description, customerName, customerPhone});

        if (!credit) {
            return res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Sales Eecorded Successfully But, Credit Failed To Te Recorder.',
            });
        }
    }

    if (payments.length > 0) {
        for (const payment of payments) {
            let method = await PaymentMethod.findById(payment.id);
            const p = await Payment.create({activeDay: activeDay.id, method: method.id, customerName, customerPhone, amount: payment.amount, stock: stock.id});
        }
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Sales Recorded Successfully.',
    });
});


const editSales = catchAsync(async (req, res) => {
    const saleId = req.query.saleId;
    const sale = await Sales.findById(saleId);

    if (!sale) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Sale Not Found.'
        });
    }

    const {products: reqProducts, isFullyPaid, customerName, customerPhone, amountPaid, payments} = req.body;

    if (!isFullyPaid && !amountPaid) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Add How Much User Paid.'
        });
    }

    if (isFullyPaid && payments.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Add How User Paid.'
        });
    }

    if (amountPaid > 0) {
        if (payments.length === 0) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Plz Add How User Paid.'
            });
        } else {
            let total = 0;
            for (const p of payments) {
                total += parseInt(p.amount);
            }
            if (parseInt(total) !== parseInt(amountPaid)) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
                });
            }
        }
    }


    let products = [];
    let _payments = [];
    let totalPrice = 0;
    let description = ``;
    let initials = [];
    let paymentDescription = ``;

    for (let payment of payments) {
        let method = await PaymentMethod.findById(payment.id);
        const _payment = {
            id: method.id,
            name: method.name,
            amount: payment.amount
        };
        _payments.push(_payment);
        paymentDescription = paymentDescription + `${_payment.name}: ${formatNumber(_payment.amount)} Rwf\n`;
    }

    const salesProducts = sale.products;
    for (let p of salesProducts) {
        initials.push({
            id: p.id,
            quantity: p.quantity
        });
    }

    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id).populate('inventoryProduct');

        const salesProduct = {
            name: product.inventoryProduct.name,
            quantity: reqProduct.quantity,
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity,
            id: product.id
        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description = description + `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;
    }

    // handle amount
    let amount = isFullyPaid ? totalPrice : amountPaid;
    if (isFullyPaid) {
        {
            let total = 0;
            for (const p of payments) {
                total += parseFloat(p.amount);
            }
            if (parseFloat(total) !== parseFloat(amount)) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
                });
            }
        }
    }

    sale.products = products;
    sale.totalPrice = totalPrice;
    sale.isFullyPaid = isFullyPaid;
    sale.customerName = customerName;
    sale.customerPhone = customerPhone;
    sale.amountPaid = amount;
    sale.description = description;
    sale.paymentDescription = paymentDescription;
    sale.payments = _payments;

    await sale.save({validateBeforeSave: false});


    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {

        let iProduct = initials[i];
        let sIProduct = await SalesProduct.findById(iProduct.id);
        let inP = await InventoryProduct.findById(sIProduct.inventoryProduct);
        inP.totalAvailable = (parseInt(inP.totalAvailable) + parseInt(iProduct.quantity));
        await inP.save({validateBeforeSave: false});

        let reqProduct = reqProducts[i];
        let product = await SalesProduct.findById(reqProduct.id);
        let inventoryProduct = await InventoryProduct.findById(product.inventoryProduct);
        inventoryProduct.totalAvailable = (parseInt(inventoryProduct.totalAvailable) - parseInt(reqProduct.quantity));
        await inventoryProduct.save({validateBeforeSave: false});
    }

    // if not fully paid, create new credit
    if (!isFullyPaid) {
        const credit = await Credit.findOne({sales: sale.id});
        if (credit) {
            credit.totalAmount = totalPrice - amountPaid;
            credit.description = description;
            credit.customerName = customerName;
            credit.customerPhone = customerPhone;

            await credit.save({validateBeforeSave: false});
        }else{
            const credit = await Credit.create({activeDay: sale.activeDay, stock: sale.stock, sales: sale.id, totalAmount: totalPrice - amountPaid, description, customerName, customerPhone});
            if (!credit) {
                return res.status(httpStatus.CREATED).json({
                    success: true,
                    message: 'Sales Eecorded Successfully But, Credit Failed To Te Recorder.',
                });
            }
        }
    }

    // edit payments

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Sales Edited Successfully.',
    });
});


const allSales = catchAsync(async (req, res) => {
    const sales = await Sales.find({stock: req.query.stockId}, {activeDay: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        sales
    });
});


const dailySales = catchAsync(async (req, res) => {

    const dayId = req.params.dayId;
    const activeDay = await checkActive(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }

    const sales = await Sales.find({activeDay: dayId}, {activeDay: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        sales
    });

});

const salesStats = catchAsync(async (req, res) => {
    const sales = await Sales.find({stock: req.query.stockId}, {activeDay: 0, products: 0});

    let totalSales = 0;
    let totalAmountSold = 0;

    sales.forEach(sale => {
        totalSales++;
        totalAmountSold += sale.totalPrice;
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stats: {
            totalSales,
            totalAmountSold
        }
    });
});


module.exports = {
    newSales,
    editSales,
    allSales,
    dailySales,
    salesStats
};
