const httpStatus = require('http-status');
const fs = require('fs');
const PDFDocument = require('pdfkit-table');
const path = require('path');

const {ActiveDay, Inventory, Sales, InventoryProduct, Crates, PaymentMethod, Payment, EmptyCrates, Stock, DistributionPoint, Producer} = require('../models');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const formatNumber = require('../utils/formatNumber');
const {checkStock} = require('../controllers/stock.controller');
const exportData = require('../utils/exportData');


const generatePDF = async (stock, activeDay) => {

    const doc = new PDFDocument();
    const fileName = `${activeDay.name}-report.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'public', 'reports', fileName);
    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // If it exists, delete it
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting existing file:', err);
                return;
            }
        });
    }
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(18).text(`${config.name}  ${activeDay.name} Daily Report. \n\n\n\n`, {underline: true});

    // Inventory Section
    doc.fontSize(12).text('Inventories \n\n', {underline: true});
    const inventories = await Inventory.find({activeDay: activeDay.id});

    if (inventories.length > 0) {
        let totalInventoryPrice = 0;

        for (const inventory of inventories) {
            const products = inventory.products;
            let total = 0;

            for (let product of products) {
                doc.fontSize(10).text(`Product : ${product.name} \n`);
                doc.fontSize(10).text(`Quantity : ${formatNumber(product.quantity)}\n`);
                doc.fontSize(10).text(`Unit Price : ${formatNumber(product.unitPrice)} Rwf\n`);
                doc.fontSize(10).text(`Total Price : ${formatNumber(product.totalPrice)} Rwf\n\n`);
                total += product.totalPrice;
            }
            doc.fontSize(12).text(`Total : ${formatNumber(total)} Rwf \n\n\n`, {underline: true});
            totalInventoryPrice += total;
        }
        doc.fontSize(13).text(`Total Inventory: ${formatNumber(totalInventoryPrice)} Rwf \n\n\n\n`, {underline: true});
    } else {
        doc.fontSize(13).text(`No Inventories Were Made On ${activeDay.name}.\n\n\n\n`);
    }


    // Sales Section
    doc.fontSize(12).text('Sales \n\n', {underline: true});
    const sales = await Sales.find({activeDay: activeDay.id});

    if (sales.length > 0) {
        let totalSalesPrice = 0;
        let remaining = 0;

        for (const sale of sales) {
            doc.fontSize(10).text(`${sale.customerName} ${sale.customerPhone ? sale.customerPhone : ''}\n\n`, {underline: true});

            for (const product of sale.products) {
                doc.fontSize(10).text(`Product : ${product.name} \n`);
                doc.fontSize(10).text(`Quantity : ${formatNumber(product.quantity)} \n`);
                doc.fontSize(10).text(`Unit Price : ${formatNumber(product.unitPrice)} Rwf\n`);
                doc.fontSize(10).text(`Total Price : ${formatNumber(product.totalPrice)} Rwf\n\n`);
            }
            doc.fontSize(10).text(`\nPaid : ${formatNumber(sale.amountPaid)} Rwf\n`);
            if (!sale.isFullyPaid) {
                doc.fontSize(10).text(`Remaining : ${formatNumber(sale.totalPrice - sale.amountPaid)} Rwf \n`);
                remaining += (sale.totalPrice - sale.amountPaid);
            }
            doc.fontSize(12).text(`Total : ${formatNumber(sale.totalPrice)} Rwf \n\n\n`, {underline: true});
            totalSalesPrice += sale.totalPrice;
        }
        doc.fontSize(13).text(`Total Paid: ${formatNumber(totalSalesPrice - remaining)} Rwf \n`);
        doc.fontSize(13).text(`Total Reaming: ${formatNumber(remaining)} Rwf \n`);
        doc.fontSize(13).text(`Total Sales: ${formatNumber(totalSalesPrice)} Rwf \n\n\n\n`, {underline: true});
    } else {
        doc.fontSize(13).text(`No Sales Were Made On ${activeDay.name}.\n\n\n\n`);
    }


    // Credit Section
    doc.fontSize(12).text('Credit \n\n', {underline: true});
    const creditSales = await Sales.find({activeDay: activeDay.id, isFullyPaid: false});
    if (creditSales.length > 0) {
        let totalCredit = 0;

        for (const sale of creditSales) {
            doc.fontSize(10).text(`${sale.customerName} ${sale.customerPhone ? sale.customerPhone : ''}\n\n`);
            doc.fontSize(10).text(`Amount To Be Paid : ${formatNumber(sale.totalPrice)} Rwf\n`);
            doc.fontSize(10).text(`Amount Paid : ${formatNumber(sale.amountPaid)} Rwf\n`);
            doc.fontSize(10).text(`Amount Remaining : ${formatNumber(sale.totalPrice - sale.amountPaid)} Rwf\n\n\n`);

            totalCredit += parseInt(sale.totalPrice - sale.amountPaid);
        }
        doc.fontSize(13).text(`Total Credit: ${formatNumber(totalCredit)} Rwf \n\n\n\n`, {underline: true});
    } else {
        doc.fontSize(13).text(`No Credits Were Made On ${activeDay.name}.\n\n\n\n`);
    }


    // crates rendering
    doc.fontSize(12).text('Crates Rendering \n\n', {underline: true});
    const crates = await Crates.find({activeDay: activeDay.id});

    if (crates.length > 0) {
        let givenC = 0;
        let returnedC = 0;
        let remainingC = 0;

        for (let crate of crates) {
            let given, returned, remaining = 0;
            doc.fontSize(10).text(`${crate.customerName} ${crate.customerPhone ? crate.customerPhone : ''}\n\n`);

            const products = crate.products;
            for (let product of products) {
                doc.fontSize(10)
                    .text(`${product.name} => given: ${formatNumber(product.given)} | returned: ${formatNumber(product.returned)} | remaining: ${formatNumber(product.remaining)} \n `, {underline: true});

                given += parseInt(product.given);
                returned += parseInt(product.returned);
                remaining += parseInt(product.remaining);
            }
            doc.fontSize(10).text(`Total => given:${formatNumber(given)} | returned:${formatNumber(returned)} | remaining:${formatNumber(remaining)}\n\n`);
            givenC += given;
            returnedC += returned;
            remainingC += remaining;
        }
        doc.fontSize(12).text(`Total => given:${formatNumber(parseInt(givenC))} | returned:${formatNumber(parseInt(returnedC))} | remaining:${formatNumber(parseInt(remainingC))}\n\n\n\n`);
    } else {
        doc.fontSize(13).text(`No Crates Were Rendered On ${activeDay.name}.\n\n\n\n`);
    }

    // crates remaining
    doc.fontSize(12).text('Empty Crates \n\n', {underline: true});
    const emptyCrates = await EmptyCrates.find({activeDay: activeDay.id});
    if (emptyCrates.length > 0) {
        let totalECrates = 0;
        let totalB = 0;

        for (let ec of emptyCrates) {
            doc.fontSize(10).text(`${ec.name}: ${formatNumber(ec.number)}\n`);
            totalECrates += parseInt(ec.number);
            if (ec.isBrarirwa) totalB += parseInt(ec.number);
        }
        doc.fontSize(12).text(`\nBrarirwa: ${formatNumber(totalB)} \n`);
        doc.fontSize(12).text(`Skol: ${formatNumber(totalECrates - totalB)} \n`);
        doc.fontSize(12).text(`Total: ${formatNumber(totalECrates)} \n\n\n\n`);
    } else {
        doc.fontSize(13).text(`No Empty Crates Recorded On ${activeDay.name}.\n\n\n\n`);
    }

    // payment
    doc.fontSize(12).text('Payments \n\n', {underline: true});
    const methods = await PaymentMethod.find({});
    let totalPayments = 0;

    for (const m of methods) {
        const payments = await Payment.find({method: m.id});
        let total = 0;
        doc.fontSize(12).text(`${m.name}\n\n`, {underline: true});

        for (let p of payments) {
            doc.fontSize(10)
                .text(`${p.customerName} ${p.customerPhone} : ${formatNumber(p.amount)} Rwf\n`);
            total += parseInt(p.amount);
        }
        doc.fontSize(12).text(`\nTotal: ${formatNumber(total)} Rwf \n\n`);
        totalPayments += total;
    }
    doc.fontSize(12).text(`\nTotal payments: ${formatNumber(totalPayments)} Rwf \n\n\n\n`);

    // inventory balancing
    doc.fontSize(12).text('Inventory Balancing \n\n', {underline: true});
    doc.fontSize(10).text('Product Name | Initial Inventory | Added Today | Final Inventory \n\n');

    const iProducts = await InventoryProduct.find({});

    for (let product of iProducts) {
        doc.fontSize(10).text(`${product.name} | initial ${formatNumber(product.prevDayRemaining)} | added ${formatNumber(product.dailyAdded)} | remaining ${formatNumber(product.totalAvailable)}\n\n`);
    }

    doc.fontSize(10).font('Times-Bold').text(`\n\n\n\n ${stock}`, {underline: true});
    doc.end();
    return fileName;

};

const monthlReport = async (stock, activeDay) => { };

async function getEntityById(entityType, entityId) {
    if (entityType === 'stock') return await Stock.findById(entityId);
    if (entityType === 'distributionPoint') return await DistributionPoint.findById(entityId);
    if (entityType === 'producer') return await Producer.findById(entityId);
    return null;
}

const checkActive = async (dayId) => {
    const activeDay = await ActiveDay.findById(dayId);

    if (!activeDay) {
        return false;
    } else {
        return true;
    }
};

const checkDay = async (data) => {
    const activeDay = await ActiveDay.findOne({isActive: true, [data.entityType]: data.entityId});
    return activeDay || null;
};

const getActiveDay = catchAsync(async (req, res) => {
    const {entityType, entityId} = req.query;
    const activeDay = await checkDay({entityType, entityId});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Day Found Successfully.',
        activeDay
    });
});

const getActiveDays = catchAsync(async (req, res) => {

    const {entityType, entityId} = req.query;

    const activeDays = await ActiveDay.find({[entityType]: entityId});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Days Found Successfully.',
        activeDays
    });
});

const startDay = catchAsync(async (req, res) => {
    const {entityId, entityType} = req.body;

    let entity = await getEntityById(entityType, entityId);

    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    // Check if there is already an active day associated with the entity
    const activeDay = await ActiveDay.findOne({
        [entityType]: entityId,
        isActive: true
    });

    if (activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'There Is Another Active Day, Plz End It And Try Again.'
        });
    }

    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let daysToCreate = [];

    // Create active day for today
    daysToCreate.push({
        [entityType]: entityId,
        name: `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`,
        type: 'day'
    });

    // If today is the last day of the month, create active day for the entire month
    if (today.getDate() === lastDayOfMonth) {
        daysToCreate.push({
            [entityType]: entityId,
            name: `${today.toLocaleString('default', {month: 'long'})}-${today.getFullYear()}`,
            type: 'month',
            isActive: false
        });
    }

    // Create active days in the database
    const createdDays = await ActiveDay.create(daysToCreate);

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Day started successfully.',
        activeDay: createdDays.find(day => day.isActive)
    });
});

const endDay = catchAsync(async (req, res) => {

    const {activeDay: dayId, entityId, entityType} = req.body;

    let entity = await getEntityById(entityType, entityId);
    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    const activeDay = await ActiveDay.findById(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Active Day Not Found.'
        });
    }

    // generate pdf
    const pdfFileName = await exportData(entity, activeDay);
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
        message: 'Day Ended Successfully.',
        url
    });
});


const downloadReport = catchAsync(async (req, res) => {

    const {activeDayId: dayId, entityId, entityType} = req.query;

    let entity = await getEntityById(entityType, entityId);
    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    const activeDay = await ActiveDay.findById(dayId);

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Active Day Not Found.'
        });
    }

    // generate pdf
    const pdfFileName = activeDay.type === 'day' ? await exportData(entity, activeDay) : await monthlReport(entity.name, activeDay);
    const url = config.url + '/public/reports/' + pdfFileName;

    return res.status(httpStatus.OK).json({
        success: true,
        url,
        message: 'Report Downloaded Successfully.'
    });
});



module.exports = {
    checkActive,
    checkDay,
    getActiveDay,
    getActiveDays,
    startDay,
    endDay,
    generatePDF,
    downloadReport
};
