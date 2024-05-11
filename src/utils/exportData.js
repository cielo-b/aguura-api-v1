const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');

const {Company, Sales, InventoryProduct, Credit, PaymentMethod, Payment, Crates, EmptyCrates, User} = require('../models');
const formatNumber = require('../utils/formatNumber');

const reportsDirectory = path.join(__dirname, '../../public/reports');

// Fonts

const JainiPurva = '/usr/share/fonts/JainiPurva-Regular.ttf';
const PoppinsRegular = '/usr/share/fonts/Poppins-Regular.ttf';
const PoppinsBold = '/usr/share/fonts/Poppins-Bold.ttf';

// const JainiPurva = 'c:/fonts/Jaini_Purva/JainiPurva-Regular.ttf';
// const PoppinsRegular = 'c:/fonts/Poppins/Poppins-Regular.ttf';
// const PoppinsBold = 'c:/fonts/Poppins/Poppins-Bold.ttf';

const exportData = async (stock, activeDay) => {

    const fileName = `${stock.id}-${activeDay.name}-daily-report.pdf`;
    const pdfFilePath = path.join(reportsDirectory, `/${fileName}`);

    const pdfDoc = new PDFDocument({margin: 40});
    const pdfStream = fs.createWriteStream(pdfFilePath);

    const title = `${stock.name} ${activeDay.name} Daily Report.`;
    const admin = await User.findById(stock.admin);
    pdfDoc.fontSize(16).font(JainiPurva).text(`${title}`);
    pdfDoc.moveDown();
    const normalX = pdfDoc.x;

    const adminTitle = `Manager: ${admin?.fullName} / ${admin?.phone}`;
    const adminTitleWidth = pdfDoc.widthOfString(adminTitle);
    const adminTitleX = (pdfDoc.page.width + 15) - pdfDoc.page.margins.right - adminTitleWidth;
    const adminTitleY = 45;
    pdfDoc.fontSize(8).font(PoppinsRegular).text(adminTitle, adminTitleX, adminTitleY);
    pdfDoc.x = normalX;
    pdfDoc.moveDown();
    pdfDoc.moveDown();

    // companies
    const companies = await Company.find({stock: stock.id});

    // sales section
    let totalSales = 0;
    let totalProducts = 0;
    let salesData = [
        ['Producer', 'Quantity', 'Total Price']
    ];
    for (let company of companies) {
        // find sales related to that company
        const sales = await Sales.find({stock: stock.id, activeDay: activeDay.id}).populate({
            path: 'products.id',
            populate: {
                path: 'inventoryProduct',
                match: {company: company.id}
            }
        });

        // filter products
        const products = sales.flatMap(sale =>
            sale.products.filter(product =>
                product.id && product.id.inventoryProduct && product.id.inventoryProduct.company.equals(company.id)
            )
        );

        let total = 0;
        let qty = 0;
        for (let product of products) {
            total = total + parseFloat(product.totalPrice);
            qty = qty + parseFloat(product.quantity);
        }

        totalSales = totalSales + parseFloat(total);
        totalProducts = totalProducts + parseFloat(qty);

        //push data
        let data = [];
        data.push(company.name);
        data.push(formatNumber(qty));
        data.push(`${formatNumber(total)} Rwf`);

        salesData.push(data);
    }
    // find sales with products without any associated company
    const salesWithNoCompanyProducts = await Sales.find({
        stock: stock.id,
        activeDay: activeDay.id
    }).populate({
        path: 'products.id',
        populate: {
            path: 'inventoryProduct',
        }
    });
    // Filter sales to include only those with products without any associated company
    const filteredSales = salesWithNoCompanyProducts.filter(sale =>
        sale.products.some(product => !product.id.inventoryProduct || !product.id.inventoryProduct.company)
    );
    // Find products whose inventory products have no associated company within filtered sales
    const productsWithNoCompany = filteredSales.flatMap(sale =>
        sale.products.filter(product =>
            !product.id.inventoryProduct || !product.id.inventoryProduct.company
        )
    );
    let subSalesTotal = 0;
    let subSaleQty = 0;
    for (let product of productsWithNoCompany) {
        subSalesTotal = subSalesTotal + parseFloat(product.totalPrice);
        subSaleQty = subSaleQty + parseFloat(product.quantity);
    }
    totalSales = totalSales + parseFloat(subSalesTotal);
    totalProducts = totalProducts + parseFloat(subSaleQty);

    //push data
    let subSaleData = [];
    subSaleData.push('Others');
    subSaleData.push(formatNumber(subSaleQty));
    subSaleData.push(`${formatNumber(subSalesTotal)} Rwf`);
    salesData.push(subSaleData);
    salesData.push(['Total', formatNumber(totalProducts), `${formatNumber(totalSales)} Rwf`]);

    const salesOptions = {
        title: "Sales",
        subtitle: "Daily Sales Categorized By Producers/Companies.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font(PoppinsRegular),
    };
    // Sales Table
    pdfDoc.table({
        headers: salesData[0],
        rows: salesData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: 'gray',
        stripe: true
    }, salesOptions);

    // =================================================================================

    // paid credit section
    const payments = await Payment.find({
        activeDay: activeDay.id,
        stock: stock.id,
        isCreditPayment: true
    }).populate({
        path: 'credit',
        match: {activeDay: {$ne: activeDay.id}}
    });
    let totalPaidCredit = 0;
    let paidCreditsData = [
        ['Customer', 'Amount']
    ];

    for (let payment of payments) {
        let data = [];
        data.push(payment.customerName);
        data.push(`${formatNumber(payment.amount)} Rwf`);
        paidCreditsData.push(data);
        totalPaidCredit = totalPaidCredit + parseFloat(payment.amount);
    }
    paidCreditsData.push(['Total', `${formatNumber(totalPaidCredit)} Rwf`]);
    const paidCreditsOptions = {
        title: "Paid Credits",
        subtitle: "Previous Days Credits Paid Today.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font(PoppinsRegular),
    };
    // Paid Credits Table
    pdfDoc.table({
        headers: paidCreditsData[0],
        rows: paidCreditsData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: 'gray',
        stripe: true
    }, paidCreditsOptions);


    // =================================================================================


    // credit section
    const credits = await Credit.find({activeDay: activeDay.id, stock: stock.id, isFullyPaid: false});
    let totalCredit = 0;
    let creditsData = [
        ['Customer', 'Credit']
    ];

    for (let credit of credits) {
        let data = [];
        let creditAmount = credit.totalAmount - credit.amountPaid;
        data.push(credit.customerName);
        data.push(`${formatNumber(creditAmount)} Rwf`);
        creditsData.push(data);
        totalCredit = totalCredit + parseFloat(creditAmount);
    }
    creditsData.push(['Total', `${formatNumber(totalCredit)} Rwf`]);
    const creditsOptions = {
        title: "Credits",
        subtitle: "Daily Credits.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font(PoppinsRegular),
    };
    // Credits Table
    pdfDoc.table({
        headers: creditsData[0],
        rows: creditsData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: 'gray',
        stripe: true
    }, creditsOptions);


    // =================================================================================

    // payments
    const methods = await PaymentMethod.find({stock: stock.id});
    let totalPayments = 0;
    let paymentsData = [
        ['Method', 'Amount']
    ];

    for (let method of methods) {
        const payments = await Payment.find({activeDay: activeDay.id, stock: stock.id, method: method.id});
        let total = 0;
        for (let payment of payments) {
            total = total + parseFloat(payment.amount);
        }
        totalPayments = totalPayments + parseFloat(total);
        let data = [];
        data.push(method.name);
        data.push(`${formatNumber(total)} Rwf`);
        paymentsData.push(data);
    }
    paymentsData.push(['Total', `${formatNumber(totalPayments)} Rwf`]);
    const paymentsOptions = {
        title: "Payments",
        subtitle: "Daily Payments By Method.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font(PoppinsRegular),
    };
    // Credits Table
    pdfDoc.table({
        headers: paymentsData[0],
        rows: paymentsData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: 'gray',
        stripe: true
    }, paymentsOptions);


    // =================================================================================
    // inventory section
    let totalCost = 0;
    let totalPrev = 0;
    let totalAdded = 0;
    let totalFinal = 0;
    const inventoryData = [
        ['Product', 'Initial', 'Added', 'Added Cost', 'Final']
    ];

    const products = await InventoryProduct.find({stock: stock.id});
    for (let product of products) {
        const name = product.name;
        const prevDayRemaining = product.prevDayRemaining;
        const dailyAdded = product.dailyAdded;
        const price = product.price;
        const totalAvailable = product.totalAvailable;
        const amount = price * dailyAdded;
        let data = [name, `${formatNumber(prevDayRemaining)}`, `${formatNumber(dailyAdded)}`, `${formatNumber(amount)} Rwf`, `${formatNumber(totalAvailable)}`];
        totalCost = totalCost + parseFloat(amount);
        totalPrev = totalPrev + parseFloat(prevDayRemaining);
        totalAdded = totalAdded + parseFloat(dailyAdded);
        totalFinal = totalFinal + parseFloat(totalAvailable);
        inventoryData.push(data);
    }
    inventoryData.push(['Total', `${formatNumber(totalPrev)}`, `${formatNumber(totalAdded)}`, `${formatNumber(totalCost)} Rwf`, `${formatNumber(totalFinal)}`]);
    const inventoryOptions = {
        title: "Inventory",
        subtitle: "Daily Inventory Balancing.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font(PoppinsRegular),
    };
    // Credits Table
    pdfDoc.table({
        headers: inventoryData[0],
        rows: inventoryData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: 'gray',
        stripe: true
    }, inventoryOptions);



    // =================================================================================
    // crates section
    let totalCrates = 0;
    const cratesData = [
        ['Customer', 'Rendered Crates']
    ];

    const crates = await Crates.find({activeDay: activeDay.id, stock: stock.id, allReturned: false});
    for (let crate of crates) {
        const products = crate.products;
        const remaining = products.filter(p => p.given > p.returned || p.remaining > 0);
        let desc = '';
        let total = 0;
        for (let p of remaining) {
            desc = desc + `${p.name}: ${p.remaining}\n`;
            total = total + parseFloat(p.remaining);
        }
        totalCrates = totalCrates + parseFloat(total);
        let data = [crate.customerName, `${formatNumber(total)}`];
        cratesData.push(data);
    }
    cratesData.push(['Total', `${formatNumber(totalCrates)}`]);
    const cratesOptions = {
        title: "Rendered Crates",
        subtitle: "Daily Rendered Crates.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font(PoppinsRegular),
    };
    // Credits Table
    pdfDoc.table({
        headers: cratesData[0],
        rows: cratesData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: 'gray',
        stripe: true
    }, cratesOptions);


    // =================================================================================

    // empty crates section
    let totalECrates = 0;
    const eCratesData = [
        ['Name', 'Total']
    ];

    const eCrates = await EmptyCrates.find({activeDay: activeDay.id, stock: stock.id});
    for (let crate of eCrates) {
        totalECrates = totalECrates + parseFloat(crate.number);
        let data = [crate.name, `${formatNumber(crate.number)}`];
        eCratesData.push(data);
    }
    eCratesData.push(['Total', `${formatNumber(totalECrates)}`]);
    const eCratesOptions = {
        title: "Empty Crates",
        subtitle: "Daily Final Empty Crates.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font(PoppinsRegular),
    };
    // Credits Table
    pdfDoc.table({
        headers: eCratesData[0],
        rows: eCratesData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: 'gray',
        stripe: true
    }, eCratesOptions);


    // =================================================================================

    // Add copyright
    const text = "Aguura@2024";
    const textWidth = pdfDoc.widthOfString(text); // Get the width of the text
    const textX = pdfDoc.page.width - 30 - pdfDoc.page.margins.right - textWidth; // Calculate the X position
    const textY = pdfDoc.page.height - pdfDoc.page.margins.bottom - 20; // Calculate the Y position
    pdfDoc.font(JainiPurva).fontSize(12).text(text, textX, textY);

    // Save the PDF
    pdfDoc.pipe(pdfStream);
    pdfDoc.end();

    return fileName;
};

module.exports = exportData;
