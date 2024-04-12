const httpStatus = require('http-status');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

const {ActiveDay, Inventory, Sales, InventoryProduct, Crates, PaymentMethod, Payment, EmptyCrates} = require('../models');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const formatNumber = require('../utils/formatNumber');

const generatePDF = async (activeDay) => {

    const doc = new PDFDocument();
    const fileName = `${activeDay.name}-report.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'public', 'reports', fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc.fontSize(18).text(`${config.name}  ${activeDay.name} Daily Report. \n\n\n\n`, {underline: true});

    // Inventory Section
    doc.fontSize(12).text('Inventories \n\n', {underline: true});
    let totalInventoryPrice = 0;
    const inventories = await Inventory.find({activeDay: activeDay.id});

    for (const inventory of inventories) {
        const products = inventory.products;
        let total = 0;

        for (let product of products) {
            doc.fontSize(10).text(`Product : ${product.name} \n\n`);
            doc.fontSize(10).text(`Quantity : ${formatNumber(product.quantity)}\n`);
            doc.fontSize(10).text(`Unit Price : ${formatNumber(product.unitPrice)} Rwf\n`);
            doc.fontSize(10).text(`Total Price : ${formatNumber(product.totalPrice)} Rwf\n\n`, {underline: true});
            total += product.totalPrice;
        }
        doc.fontSize(12).text(`Total : ${formatNumber(total)} Rwf \n\n\n`, {underline: true});
        totalInventoryPrice += total;
    }
    doc.fontSize(13).text(`Total Inventory Amount: ${formatNumber(totalInventoryPrice)} \n\n\n\n Rwf`, {underline: true});


    // Sales Section
    doc.fontSize(12).text('Sales \n\n', {underline: true});
    let totalSalesPrice = 0;
    let remaining = 0;

    const sales = await Sales.find({activeDay: activeDay.id});

    for (const sale of sales) {
        doc.fontSize(10).text(`${sale.customerName} ${sale.customerPhone ? sale.customerPhone : ''}\n`, {underline: true});

        for (const product of sale.products) {
            doc.fontSize(10).text(`Product : ${product.name} \n`);
            doc.fontSize(10).text(`Quantity : ${formatNumber(product.quantity)} \n`);
            doc.fontSize(10).text(`Unit Price : ${formatNumber(product.unitPrice)} Rwf\n`);
            doc.fontSize(10).text(`Total Price : ${formatNumber(product.totalPrice)} Rwf\n\n`, {underline: true});
        }
        doc.fontSize(10).text(`\nAmount Paid : ${formatNumber(sale.amountPaid)}\n`);
        if (!sale.isFullyPaid) {
            doc.fontSize(10).text(`Remaining : ${formatNumber(sale.totalPrice - sale.amountPaid)} Rwf \n`);
            remaining += (sale.totalPrice - sale.amountPaid);
        }
        doc.fontSize(12).text(`Total : ${formatNumber(sale.totalPrice)} Rwf \n\n\n`, {underline: true});
        totalSalesPrice += sale.totalPrice;
    }
    doc.fontSize(13).text(`Total Paid: ${formatNumber(totalSalesPrice - remaining)} Rwf \n`);
    doc.fontSize(13).text(`Total Reaming: ${formatNumber(remaining)} Rwf \n`);
    doc.fontSize(13).text(`Total Sales Amount: ${formatNumber(totalSalesPrice)} Rwf \n\n\n\n`, {underline: true});


    // Credit Section
    doc.fontSize(12).text('Credit \n\n', {underline: true});
    let totalCredit = 0;

    const creditSales = await Sales.find({activeDay: activeDay.id, isFullyPaid: false});

    for (const sale of creditSales) {
        doc.fontSize(10).text(`${sale.customerName} ${sale.customerPhone ? sale.customerPhone : ''}\n`);
        doc.fontSize(10).text(`Amount To Be Paid : ${formatNumber(sale.totalPrice)}\n`);
        doc.fontSize(10).text(`Amount Paid : ${formatNumber(sale.amountPaid)}\n`);
        doc.fontSize(10).text(`Amount Remaining : ${formatNumber(sale.totalPrice - sale.amountPaid)}\n\n`);

        doc.fontSize(12).text(`Total : ${formatNumber(sale.totalPrice)} Rwf \n\n`, {underline: true});
        totalCredit += parseInt(sale.totalPrice - sale.amountPaid);
    }
    doc.fontSize(13).text(`Total Credit: ${formatNumber(totalCredit)} Rwf \n\n\n\n`, {underline: true});


    // crates rendering
    doc.fontSize(12).text('Crates Rendering \n\n', {underline: true});
    const crates = await Crates.find({activeDay: activeDay.id});
    let givenC, returnedC, remainingC = 0;

    for (let crate of crates) {
        let given, returned, remaining = 0;
        doc.fontSize(10).text(`${crate.customerName} ${crate.customerPhone ? crate.customerPhone : ''}\n\n`);

        const products = crate.products;
        for (let product of products) {
            doc.fontSize(10)
                .text(`${product.name} => `, {underline: true})
                .text(`given: ${formatNumber(product.given)} | `)
                .text(`returned: ${formatNumber(product.returned)} | `)
                .text(`remaining: ${formatNumber(product.remaining)} \n`);

            given += parseInt(product.given);
            returned += parseInt(product.returned);
            remaining += parseInt(product.remaining);
        }
        doc.fontSize(10).text(`Total => given:${formatNumber(given)} | returned:${formatNumber(returned)} | remaining:${formatNumber(remaining)}\n\n`);
        givenC += given;
        returnedC += returned;
        remainingC += remaining;
    }
    doc.fontSize(12).text(`Total => given:${formatNumber(givenC)} | returned:${formatNumber(returnedC)} | remaining:${formatNumber(remainingC)}\n\n\n\n`);

    // crates remaining
    doc.fontSize(12).text('Empty Crates \n\n', {underline: true});
    const emptyCrates = await EmptyCrates.find({activeDay: activeDay.id});
    let totalECrates = 0;
    let totalB = 0;

    for (let ec of emptyCrates) {
        doc.fontSize(10).text(`${ec.name}: ${formatNumber(ec.number)}\n`);
        totalECrates += parseInt(ec.number);
        if (ec.isBrarirwa) totalB += parseInt(ec.number);
    }
    doc.fontSize(12).text(`Brarirwa: ${formatNumber(totalB)} \n`);
    doc.fontSize(12).text(`Skol: ${formatNumber(totalECrates - totalB)} \n`);
    doc.fontSize(12).text(`Total: ${formatNumber(totalECrates)} \n\n\n\n`);

    // payment
    doc.fontSize(12).text('Payments \n\n', {underline: true});
    const methods = await PaymentMethod.find({});
    let totalPayments = 0;

    for (const m of methods) {
        const payments = await Payment.find({method: m.id});
        let total = 0;

        for (let p of payments) {
            total += parseInt(p.amount);
        }
        doc.fontSize(12).text(`${m.name}: ${formatNumber(total)} Rwf\n`, {underline: true});
        totalPayments += total;
    }
    doc.fontSize(12).text(`Total payments: ${formatNumber(totalPayments)} \n\n\n\n`);

    // inventory balancing
    doc.fontSize(12).text('Inventory Balancing \n\n', {underline: true});
    doc.fontSize(10).text('Product Name | Initial Inventory | Added Today | Final Inventory');

    const iProducts = await InventoryProduct.find({});

    for (let product of iProducts) {
        doc.fontSize(10).text(`${product.name} | ${formatNumber(product.prevDayRemaining)} | ${formatNumber(product.dailyAdded)} | ${formatNumber(product.totalAvailable)}\n`);
    }



    doc.fontSize(10).font('Times-Bold').text(`\n\n\n\n ${config.name}`, {underline: true});
    doc.end();
    return fileName;

};

const checkActive = async (dayId) => {
    const activeDay = await ActiveDay.findById(dayId);

    if (!activeDay || activeDay.isActive === false) {
        return false;
    } else {
        return true;
    }
};

const checkDay = async () => {
    const activeDay = await ActiveDay.findOne({isActive: true});

    if (!activeDay) {
        return null;
    } else {
        return activeDay;
    }
};

const getActiveDay = catchAsync(async (req, res) => {

    const activeDay = await ActiveDay.findOne({isActive: true});

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No active day.'
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Day found successfully.',
        day: activeDay
    });
});

const getActiveDays = catchAsync(async (req, res) => {

    const activeDays = await ActiveDay.find({});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Days found successfully.',
        activeDays
    });
});

const startDay = catchAsync(async (req, res) => {

    const activeDay = await ActiveDay.findOne({isActive: true});

    if (activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'There is another active day, plz end it and try again.'
        });
    }

    const day = await ActiveDay.create({});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Day activated successfully.',
        day
    });
});

const endDay = catchAsync(async (req, res) => {

    const activeDay = await ActiveDay.findById(req.params.id);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Active day not found.'
        });
    }

    // generate pdf
    const pdfFileName = await generatePDF(activeDay);
    const url = config.url + '/public/reports/' + pdfFileName;

    // update remaining products in inventory
    const products = await InventoryProduct.find({});
    for (const product of products) {
        product.prevDayRemaining = product.totalAvailable;
        product.dailyAdded = 0;
        await product.save({validateBeforeSave: false});
    }

    activeDay.isActive = false;
    await activeDay.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Day ended successfully.',
        url
    });
});



module.exports = {
    checkActive,
    checkDay,
    getActiveDay,
    getActiveDays,
    startDay,
    endDay,
    generatePDF
};
