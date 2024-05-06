const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');

const {ActiveDay, Inventory, Sales, InventoryProduct, Crates, PaymentMethod, Payment, EmptyCrates} = require('../models');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const formatNumber = require('../utils/formatNumber');
const {checkStock} = require('../controllers/stock.controller');

const reportsDirectory = path.join(__dirname, '../../public/reports');

const exportData = async (activeDay) => {

    // Define your data
    const data = [
        ['Name', 'Age', 'Country'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
        ['John', 30, 'USA'],
        ['Alice', 25, 'UK'],
        ['Bob', 35, 'Canada'],
    ];
    const pdfFilePath = path.join(reportsDirectory, `${activeDay.name}-daily-report.pdf`);

    const pdfDoc = new PDFDocument({
        margin: 40 // Set margin to 40 units on all sides
    });
    const pdfStream = fs.createWriteStream(pdfFilePath);

    const title = `${activeDay.name} Daily Report.\n`;
    pdfDoc.fontSize(16).font('c:/fonts/Jaini_Purva/JainiPurva-Regular.ttf').text(`${title}`,);
    pdfDoc.moveDown();
    pdfDoc.font('c:/fonts/Poppins/Poppins-Regular.ttf');
    pdfDoc.fontSize(8);

    const options = {
        title: "Sales",
        subtitle: "Daily sales for each product Group.",
        width: 500,
        x: 0,
        y: 0,
        columnSpacing: 5,
        prepareHeader: () => pdfDoc.fontSize(8).font('c:/fonts/Poppins/Poppins-Bold.ttf'),
        prepareRow: (row, indexColumn, indexRow, rectRow) => pdfDoc.fontSize(8).font('c:/fonts/Poppins/Poppins-Regular.ttf'),
    };

    // Create a table
    pdfDoc.table({
        headers: data[0], 
        rows: data.slice(1), 
        widths: [null, null, null], 
        headerBackgroundColor: 'gray',
        stripe: true
    }, options);

    // Add copyright
    const text = "\n\nAguura@2024";
    const textWidth = pdfDoc.widthOfString(text); // Get the width of the text
    const textX = pdfDoc.page.width - 40 - pdfDoc.page.margins.right - textWidth; // Calculate the X position
    const textY = pdfDoc.page.height - pdfDoc.page.margins.bottom - 50; // Calculate the Y position
    pdfDoc.font('c:/fonts/Jaini_Purva/JainiPurva-Regular.ttf').fontSize(12).text(text, textX, textY);

    // Save the PDF
    pdfDoc.pipe(pdfStream);
    pdfDoc.end();
};

exportData({name: '2024'});
