const httpStatus = require('http-status');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const {ActiveDay, Inventory, Sales, InventoryProduct} = require('../models');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');

const generatePDF = async (activeDay) => {

    const doc = new PDFDocument();
    const fileName = `${activeDay.name}-report.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'public', 'reports', fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc.fontSize(18).text(`${config.name} | ${activeDay.name} Daily Report. \n\n\n\n`, {underline: true});

    // Inventory Section
    doc.fontSize(16).text('Inventories \n\n', {underline: true});

    let totalInventoryPrice = 0;

    const inventories = await Inventory.find({activeDay: activeDay.id});

    for (const inventory of inventories) {
        const products = inventory.products;
        let total = 0;

        for (let product of products) {
            doc.fontSize(12).text(`Product : ${product.name} \n`);
            doc.fontSize(12).text(`Quantity : ${product.quantity}\n`);
            doc.fontSize(12).text(`Unit Price : ${product.unitPrice} Rwf\n`);
            doc.fontSize(12).text(`Total Price : ${product.totalPrice} Rwf\n`);
            total += product.totalPrice;
        }
        doc.fontSize(14).text(`Total : ${total} Rwf \n\n`);
        totalInventoryPrice += total;
    }

    doc.fontSize(15).text(`Total Inventory Amount: ${totalInventoryPrice} \n\n\n\n`);



    // Sales Section

    doc.fontSize(16).text('Sales \n\n', {underline: true});
    let totalSalesPrice = 0;
    let remaining = 0;

    const sales = await Sales.find({activeDay: activeDay.id});

    for (const sale of sales) {
        doc.fontSize(12).text(`${sale.customerName} ${sale.customerPhone ? sale.customerPhone : ''}\n`);

        for (const product of sale.products) {
            doc.fontSize(12).text(`Product : ${product.name} \n`);
            doc.fontSize(12).text(`Quantity : ${product.quantity} \n`);
            doc.fontSize(12).text(`Unit Price : ${product.unitPrice} Rwf\n`);
            doc.fontSize(12).text(`Total Price : ${product.totalPrice}\n`);
        }
        doc.fontSize(12).text(`Amount Paid : ${sale.amountPaid}\n`);
        if (!sale.isFullyPaid) {
            doc.fontSize(12).text(`Remaining : ${sale.totalPrice - sale.amountPaid} Rwf \n`);
            remaining += (sale.totalPrice - sale.amountPaid);
        }
        doc.fontSize(14).text(`Total : ${total} Rwf \n\n`);
        totalSalesPrice += sale.totalPrice;
    }

    doc.fontSize(15).text(`Total Paid: ${totalSalesPrice - remaining} Rwf \n`);
    doc.fontSize(15).text(`Total Reaming: ${remaining} Rwf \n`);
    doc.fontSize(15).text(`Total Sales Amount: ${totalSalesPrice} Rwf \n\n\n\n`);


    // inventory balancing

    doc.fontSize(16).text('Inventory Balancing \n\n', {underline: true});

    const pageWidth = doc.page.width;
    const columnWidth = pageWidth / 3;
    const pCol = 0;
    const iCol = columnWidth;
    const fCol = columnWidth * 2;

    doc.text('Product Name', pCol, doc.y);
    doc.text('Initail Inventory', iCol, doc.y);
    doc.text('Final Inventory', fCol, doc.y);

    doc.moveTo(pCol, doc.y).lineTo(pCol, doc.y + 100).stroke();
    doc.moveTo(iCol, doc.y).lineTo(iCol, doc.y + 100).stroke();
    doc.moveTo(fCol, doc.y).lineTo(fCol, doc.y + 100).stroke();

    const iProducts = await InventoryProduct.find({});

    for (let product of iProducts) {
        doc.text(`${product.name}`, pCol, doc.y);
        doc.text(`${product.prevDayRemaining}`, iCol, doc.y);
        doc.text(`${product.totalAvailable}`, fCol, doc.y);
        doc.moveDown();
        doc.moveTo(pCol, doc.y).lineTo(fCol + columnWidth, doc.y).stroke();
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

const startDay = catchAsync(async (req, res) => {

    const activeDay = await ActiveDay.find({isActive: true});

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

    // update remaining products in inventory
    const products = await InventoryProduct.find({});
    for (const product in products) {
        product.prevDayRemaining = product.totalAvailable;
        await product.save({validateBeforeSave: false});
    }

    activeDay.isActive = false;
    await activeDay.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Day ended successfully.',
        pdfFileName
    });
});

module.exports = {
    checkActive,
    startDay,
    endDay,
    generatePDF
};
