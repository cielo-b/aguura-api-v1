const httpStatus = require('http-status');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

const {ActiveDay, Inventory, Sales, InventoryProduct, Crates, PaymentMethod, Payment, EmptyCrates} = require('../models');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const formatNumber = require('../utils/formatNumber');
const {checkStock} = require('../controllers/stock.controller');

const generatePDF = async (stock, activeDay) => {

    const doc = new PDFDocument();
    const fileName = `${activeDay.name}-report.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'public', 'reports', fileName);
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


const generateSimplePDF = async (stock, activeDay) => {
    const doc = new PDFDocument();
    const fileName = `${activeDay.name}-daily-report.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'public', 'reports', fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    const addPageIfNecessary = (requiredHeight) => {
        if (doc.y + requiredHeight > doc.page.height - 50) {
            doc.addPage();
            startY = 50;
        }
    };

    // Header
    doc.fontSize(18).text(`${config.name}  ${activeDay.name} Daily Report. \n\n\n\n`, 30, 30, {underline: true});

    // Sales Section
    doc.fontSize(13).text('Sales \n', 30, 60, {underline: true});
    let startY = doc.y + 30;

    const sales = await Sales.find({activeDay: activeDay.id});

    if (sales.length > 0) {
        let totalSalesPrice = 0;
        let remaining = 0;

        const headers = ['Customer', 'Products', 'Total Amt', 'Paid Amt', 'Remaining Amt'];
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, index) => {
            doc.text(header, index * 100 + 30, startY);
        });

        doc.moveTo(30, startY + 10).lineTo(505, startY + 10).stroke();

        sales.forEach((sale, index) => {
            let l = sale.products.length;
            const rowHeight = Math.max((l + 2) * 10, 20);
            addPageIfNecessary(rowHeight);

            doc.text(`\n${sale.customerName}`, 30, startY);
            const productsY = startY;
            sale.products.forEach((product, index) => {
                doc.text(`${index === l ?
                    product.name + ' ' + formatNumber(product.quantity) + '\n' :
                    '\n' + product.name + ' ' + formatNumber(product.quantity)}`, 130, productsY + index * 10);
            });
            doc.text(`\n${formatNumber(sale.totalPrice)} Rwf`, 230, startY);
            doc.text(`\n${formatNumber(sale.amountPaid)} Rwf`, 330, startY);
            doc.text(`\n${formatNumber(sale.totalPrice - sale.amountPaid)} Rwf`, 430, startY);

            doc.moveTo(30, startY + rowHeight).lineTo(505, startY + rowHeight).stroke();
            startY += rowHeight;

            if (!sale.isFullyPaid) {
                remaining += (sale.totalPrice - sale.amountPaid);
            }
            totalSalesPrice += sale.totalPrice;

            if (index === (sales.length - 1)) {
                doc.text(`\nTotal`, 30);
                doc.text(`\n${formatNumber(totalSalesPrice)} Rwf`, 230, startY);
                doc.text(`\n${formatNumber(totalSalesPrice - remaining)} Rwf`, 330, startY);
                doc.text(`\n${formatNumber(remaining)} Rwf`, 430, startY);
            }
        });

    } else {
        doc.fontSize(13).text(`No Sales Were Made On ${activeDay.name}`, 30, undefined);
    }

    // Credit Section
    doc.fontSize(12).text('\n\n\n\nCredits \n', 30, undefined, {underline: true});
    startY = doc.y + 30;

    const creditSales = await Sales.find({activeDay: activeDay.id, isFullyPaid: false});

    if (creditSales.length > 0) {
        const headers = ['Customer', 'Paid Amt', 'Remaining Amt', 'Total Amt'];
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, index) => {
            doc.text(header, index * 120 + 30, startY);
        });

        doc.moveTo(30, startY + 10).lineTo(480, startY + 10).stroke();

        let totalCredit = 0;
        let paid = 0;

        creditSales.forEach((sale, index) => {
            const rowHeight = 20;
            addPageIfNecessary(rowHeight);

            doc.text(`\n${sale.customerName}`, 30, startY);
            doc.text(`\n${formatNumber(sale.amountPaid)} Rwf`, 150, startY);
            doc.text(`\n${formatNumber(sale.totalPrice - sale.amountPaid)} Rwf`, 270, startY);
            doc.text(`\n${formatNumber(sale.totalPrice)} Rwf`, 390, startY);

            doc.moveTo(30, startY + 10).lineTo(480, startY + 10).stroke();
            startY += 20;

            totalCredit += parseInt(sale.totalPrice - sale.amountPaid);
            paid += parseInt(sale.amountPaid);

            if (index === (creditSales.length - 1)) {
                doc.text(`\nTotal`, 30);
                doc.text(`\n${formatNumber(paid)} Rwf`, 150, startY);
                doc.text(`\n${formatNumber(totalCredit)} Rwf`, 270, startY);
                doc.text(`\n${formatNumber(totalCredit + paid)} Rwf`, 390, startY);
            }
        });
    } else {
        doc.fontSize(13).text(`No Credits Were Made On ${activeDay.name}.`, 30, undefined);
    }

    // Crates Section
    doc.fontSize(12).text('\n\n\n\nRendered Crates \n', 30, undefined, {underline: true});
    startY = doc.y + 30;
    const crates = await Crates.find({activeDay: activeDay.id});

    if (crates.length > 0) {
        const headers = ['Customer', 'Given', 'Returned', 'Remaining'];
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, index) => {
            doc.text(header, index * 120 + 30, startY);
        });

        doc.moveTo(30, startY + 10).lineTo(480, startY + 10).stroke();

        let givenC = 0;
        let returnedC = 0;
        let remainingC = 0;

        crates.forEach((crate, index) => {
            let given, returned, remaining = 0;

            let l = crate.products.length;
            const rowHeight = Math.max((l + 2) * 10, 20);
            addPageIfNecessary(rowHeight);

            doc.text(`\n${crate.customerName}`, 30, startY);
            const productsY = startY;
            crate.products.forEach((product, index) => {
                given += parseInt(product.given);
                doc.text(`${index === l ?
                    product.name + ' ' + formatNumber(product.given) + '\n' :
                    '\n' + product.name + ' ' + formatNumber(product.given)}`, 150, productsY + index * 10);
            });
            crate.products.forEach((product, index) => {
                returned += parseInt(product.returned);
                doc.text(`${index === l ?
                    product.name + ' ' + formatNumber(product.returned) + '\n' :
                    '\n' + product.name + ' ' + formatNumber(product.returned)}`, 270, productsY + index * 10);
            });
            crate.products.forEach((product, index) => {
                remaining += parseInt(product.remaining);
                doc.text(`${index === l ?
                    product.name + ' ' + formatNumber(product.remaining) + '\n' :
                    '\n' + product.name + ' ' + formatNumber(product.remaining)}`, 390, productsY + index * 10);
            });

            doc.moveTo(30, startY + rowHeight).lineTo(480, startY + rowHeight).stroke();
            startY += rowHeight;

            givenC += given;
            returnedC += returned;
            remainingC += remaining;

            if (index === (crates.length - 1)) {
                doc.text(`\nTotal`, 30);
                doc.text(`\n${formatNumber(givenC)}`, 150, startY);
                doc.text(`\n${formatNumber(returnedC)}`, 270, startY);
                doc.text(`\n${formatNumber(remainingC)}`, 390, startY);
            }
        });
    } else {
        doc.fontSize(13).text(`No Crates Were Rendered On ${activeDay.name}.`, 30, undefined);
    }

    // Crates remaining
    doc.fontSize(12).text('\n\n\n\nEmpty Crates \n\n', 30, undefined, {underline: true});
    startY = doc.y + 30;

    const emptyCrates = await EmptyCrates.find({activeDay: activeDay.id});

    if (emptyCrates.length > 0) {
        const headers = ['Name', 'Total'];
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, index) => {
            doc.text(header, index * 220 + 30, startY);
        });

        doc.moveTo(30, startY + 10).lineTo(440, startY + 10).stroke();
        startY += 20;

        let totalECrates = 0;
        let totalB = 0;

        emptyCrates.forEach((ec, index) => {
            const rowHeight = 20;
            addPageIfNecessary(rowHeight);

            doc.text(`${ec.name}`, 30, startY);
            doc.text(`${ec.number}`, 250, startY);

            doc.moveTo(30, startY + 10).lineTo(440, startY + 10).stroke();
            startY += 20;

            totalECrates += parseInt(ec.number);
            if (ec.isBrarirwa) totalB += parseInt(ec.number);

            if (index === (emptyCrates.length - 1)) {
                doc.text(`\nTotal`, 30);
                doc.text(`\nBrarirwa: ${formatNumber(totalB)}`, 250, startY);
                doc.text(`\nNon-Brarirwa: ${formatNumber(totalECrates - totalB)}`, 250, startY + 20);
                doc.text(`\nTotal: ${formatNumber(totalECrates)}`, 250, startY + 40);
            }
        });
    } else {
        doc.fontSize(13).text(`No Empty Crates Recorded On ${activeDay.name}.`);
    }

    // Inventory balancing
    doc.fontSize(12).text('\n\n\n\nInventory \n', 30, undefined, {underline: true});
    startY = doc.y + 30;
    const iProducts = await InventoryProduct.find({stock: stock.id});

    if (iProducts.length > 0) {
        const headers = ['Name', 'Initial Stk', 'Added Stk', 'Cost Amt', 'Final Stk'];
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, index) => {
            doc.text(header, index * 100 + 30, startY);
        });

        doc.moveTo(30, startY + 10).lineTo(505, startY + 10).stroke();
        startY += 20;

        let initial = 0;
        let added = 0;
        let final = 0;
        let cost = 0;

        iProducts.forEach((product, index) => {
            const rowHeight = 20;
            addPageIfNecessary(rowHeight);

            doc.text(`${product.name}`, 30, startY);
            doc.text(`${formatNumber(product.prevDayRemaining)}`, 130, startY);
            doc.text(`${formatNumber(product.dailyAdded)}`, 230, startY);
            doc.text(`${formatNumber(product.dailyAdded * product.unitPrice)} Rwf`, 330, startY);
            doc.text(`${formatNumber(product.totalAvailable)}`, 430, startY);

            doc.moveTo(30, startY + 10).lineTo(505, startY + 10).stroke();
            startY += 20;

            initial += product.prevDayRemaining;
            added += product.dailyAdded;
            final += product.totalAvailable;
            cost += product.dailyAdded * product.unitPrice;

            if (index === (iProducts.length - 1)) {
                doc.text(`\nTotal`, 30);
                doc.text(`\n${formatNumber(initial)}`, 130, startY);
                doc.text(`\n${formatNumber(added)}`, 230, startY);
                doc.text(`\n${formatNumber(cost)} Rwf`, 330, startY);
                doc.text(`\n${formatNumber(final)}`, 430, startY);
            }
        });
    } else {
        doc.fontSize(13).text(`No Inventory Recorded ${activeDay.name}.`);
    }

    doc.fontSize(10).font('Times-Bold').text(`\n\n\n\n ${stock.name}`, 30, undefined, {underline: true});
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

const checkDay = async (stockId) => {
    const activeDay = await ActiveDay.findOne({isActive: true, stock: stockId});

    if (!activeDay) {
        return null;
    } else {
        return activeDay;
    }
};

const getActiveDay = catchAsync(async (req, res) => {

    const activeDay = await ActiveDay.findOne({isActive: true, stock: req.query.stockId});

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day.'
        });
    }

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Day Found Successfully.',
        day: activeDay
    });
});

const getActiveDays = catchAsync(async (req, res) => {

    const activeDays = await ActiveDay.find({stock: req.query.stockId});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Days Found Successfully.',
        activeDays
    });
});

const startDay = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const activeDay = await ActiveDay.findOne({isActive: true, stock: stock.id});

    if (activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'There Is Another Active Day, Plz End It And Try Again.'
        });
    }

    const day = await ActiveDay.create({stock: stock.id});

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Day Started Successfully.',
        day
    });
});

const endDay = catchAsync(async (req, res) => {

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const activeDay = await ActiveDay.findById(req.params.id);
    const {crates} = req.body;

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Active Day Not Found.'
        });
    }

    // register crates
    for (let crate of crates) {
        await EmptyCrates.create({stock: stock.id, activeDay: activeDay.id, name: crate.name, number: crate.number, isBrarirwa: crate.isBrarirwa});
    }

    // generate pdf
    const pdfFileName = await generatePDF(stock.name, activeDay);
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

    const stockId = req.query.stockId;
    const stock = await checkStock(stockId);

    if (!stock) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Stock Not Found.'
        });
    }

    const activeDay = await ActiveDay.findById(req.query.activeDayId);
    const {crates} = req.body;

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Active Day Not Found.'
        });
    }

    // generate pdf
    const pdfFileName = await generatePDF(stock.name, activeDay);
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
