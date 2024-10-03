const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require("path");

const {
  Sales,
  InventoryProduct,
  Credit,
  PaymentMethod,
  Payment,
  Crates,
  EmptyCrates,
  User,
  SalesProduct,
  Expense,
} = require("../models");
const formatNumber = require("../utils/formatNumber");

const reportsDirectory = path.join(__dirname, "../../public/reports");

// Fonts

const JainiPurva = '/usr/share/fonts/aguurafonts/JainiPurva-Regular.ttf';
const PoppinsRegular = '/usr/share/fonts/aguurafonts/Poppins-Regular.ttf';
const PoppinsBold = '/usr/share/fonts/aguurafonts/Poppins-Bold.ttf';

// const JainiPurva = "c:/fonts/Jaini_Purva/JainiPurva-Regular.ttf";
// const PoppinsRegular = "c:/fonts/Poppins/Poppins-Regular.ttf";
// const PoppinsBold = "c:/fonts/Poppins/Poppins-Bold.ttf";

const exportData = async (stock, activeDay) => {
  const type = stock.type;

  const fileName = `${stock.id}-${activeDay.name}-daily-report.pdf`;
  const pdfFilePath = path.join(reportsDirectory, `/${fileName}`);

  const pdfDoc = new PDFDocument({ margin: 40 });
  const pdfStream = fs.createWriteStream(pdfFilePath);

  const title = `${stock.name} ${activeDay.name} Daily Report.`;
  const admin = await User.findById(stock.admin);
  pdfDoc.fontSize(16).font(JainiPurva).text(`${title}`);
  pdfDoc.moveDown();

  const adminTitle = `Manager: ${admin?.fullName} / ${admin?.phone}`;
  pdfDoc.fontSize(8).font(PoppinsRegular).text(`${adminTitle}`);
  pdfDoc.moveDown();

  // Helper function to check if there's enough space for the next section
  const ensureSpaceForNextSection = (heightNeeded) => {
    if (
      pdfDoc.y + heightNeeded >
      pdfDoc.page.height - pdfDoc.page.margins.bottom
    ) {
      pdfDoc.addPage();
    }
  };

  // sales section
  let totalSales = 0;
  let totalProducts = 0;
  let salesData = [["Product", "Quantity", "Total Price"]];

  const salesProducts = await SalesProduct.find({ stock: stock.id }).populate(
    "inventoryProduct",
  );

  for (let product of salesProducts) {
    // find sales related to that company
    const sales = await Sales.find({
      stock: stock.id,
      activeDay: activeDay.id,
      "products.salesProduct": product.id,
    });

    // filter products
    const products = sales.flatMap((sale) =>
      sale.products.filter(
        (p) => p.salesProduct.toString() === product._id.toString(),
      ),
    );

    let total = 0;
    let qty = 0;
    for (let product of products) {
      total = total + parseFloat(product.totalPrice);
      qty = qty + parseFloat(product.quantity);
    }

    totalSales = totalSales + parseFloat(total);
    totalProducts = totalProducts + parseFloat(qty);

    // push data
    let data = [];
    data.push(product.inventoryProduct.name);
    data.push(formatNumber(qty));
    data.push(`${formatNumber(total)} Rwf`);

    salesData.push(data);
  }
  salesData.push([
    "Total",
    formatNumber(totalProducts),
    `${formatNumber(totalSales)} Rwf`,
  ]);

  const salesOptions = {
    title: "Sales",
    subtitle: "Daily Sales Categorized By Product",
    width: 500,
    x: 0,
    y: 0,
    columnSpacing: 5,
    prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
    prepareRow: (row, indexColumn, indexRow, rectRow) =>
      pdfDoc.fontSize(8).font(PoppinsRegular),
  };

  // Ensure there's space before adding the sales table
  ensureSpaceForNextSection(100);

  // Sales Table
  await pdfDoc.table(
    {
      headers: salesData[0],
      rows: salesData.slice(1),
      widths: [null, null, null],
      headerBackgroundColor: "gray",
      stripe: true,
    },
    salesOptions,
  );

  // paid credit section
  const payments = await Payment.find({
    activeDay: activeDay.id,
    stock: stock.id,
    isCreditPayment: true,
    distributionPoint: null,
    producer: null,
  }).populate({
    path: "credit",
    match: { activeDay: { $ne: activeDay.id } },
  });
  let totalPaidCredit = 0;
  let paidCreditsData = [["Customer", "Amount"]];

  for (let payment of payments) {
    let data = [];
    data.push(payment.customerName);
    data.push(`${formatNumber(payment.amount)} Rwf`);
    paidCreditsData.push(data);
    totalPaidCredit = totalPaidCredit + parseFloat(payment.amount);
  }
  paidCreditsData.push(["Total", `${formatNumber(totalPaidCredit)} Rwf`]);
  const paidCreditsOptions = {
    title: "Paid Credits",
    subtitle: "Previous Days Credits Paid Today.",
    width: 500,
    x: 0,
    y: 0,
    columnSpacing: 5,
    prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
    prepareRow: (row, indexColumn, indexRow, rectRow) =>
      pdfDoc.fontSize(8).font(PoppinsRegular),
  };

  // Ensure there's space before adding the paid credits table
  ensureSpaceForNextSection(100);

  // Paid Credits Table
  await pdfDoc.table(
    {
      headers: paidCreditsData[0],
      rows: paidCreditsData.slice(1),
      widths: [null, null, null],
      headerBackgroundColor: "gray",
      stripe: true,
    },
    paidCreditsOptions,
  );

  // credit section
  const credits = await Credit.find({
    activeDay: activeDay.id,
    stock: stock.id,
    isFullyPaid: false,
    distributionPoint: null,
    producer: null,
  });
  let totalCredit = 0;
  let creditsData = [["Customer", "Credit"]];

  for (let credit of credits) {
    let data = [];
    let creditAmount = credit.totalAmount - credit.amountPaid;
    data.push(credit.customerName);
    data.push(`${formatNumber(creditAmount)} Rwf`);
    creditsData.push(data);
    totalCredit = totalCredit + parseFloat(creditAmount);
  }
  creditsData.push(["Total", `${formatNumber(totalCredit)} Rwf`]);
  const creditsOptions = {
    title: "Credits",
    subtitle: "Daily Credits.",
    width: 500,
    x: 0,
    y: 0,
    columnSpacing: 5,
    prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
    prepareRow: (row, indexColumn, indexRow, rectRow) =>
      pdfDoc.fontSize(8).font(PoppinsRegular),
  };

  // Ensure there's space before adding the credits table
  ensureSpaceForNextSection(100);

  // Credits Table
  await pdfDoc.table(
    {
      headers: creditsData[0],
      rows: creditsData.slice(1),
      widths: [null, null, null],
      headerBackgroundColor: "gray",
      stripe: true,
    },
    creditsOptions,
  );

  // payments section
  const methods = await PaymentMethod.find({ stock: stock.id });
  let totalPayments = 0;
  let paymentsData = [["Method", "Amount"]];

  for (let method of methods) {
    const payments = await Payment.find({
      activeDay: activeDay.id,
      stock: stock.id,
      method: method.id,
    });
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
  paymentsData.push(["Total", `${formatNumber(totalPayments)} Rwf`]);
  const paymentsOptions = {
    title: "Payments",
    subtitle: "Daily Payments By Method.",
    width: 500,
    x: 0,
    y: 0,
    columnSpacing: 5,
    prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
    prepareRow: (row, indexColumn, indexRow, rectRow) =>
      pdfDoc.fontSize(8).font(PoppinsRegular),
  };

  // Ensure there's space before adding the payments table
  ensureSpaceForNextSection(100);

  // Payments Table
  await pdfDoc.table(
    {
      headers: paymentsData[0],
      rows: paymentsData.slice(1),
      widths: [null, null, null],
      headerBackgroundColor: "gray",
      stripe: true,
    },
    paymentsOptions,
  );

  // inventory section
  let totalCost = 0;
  let totalPrev = 0;
  let totalAdded = 0;
  let totalFinal = 0;
  const inventoryData = [
    ["Product", "Initial", "Added", "Added Cost", "Final"],
  ];

  const products = await InventoryProduct.find({ stock: stock.id });
  for (let product of products) {
    const name = product.name;
    const prevDayRemaining = product.prevDayRemaining;
    const dailyAdded = product.dailyAdded;
    const price = product.price;
    const totalAvailable = product.totalAvailable;
    const amount = price * dailyAdded;
    let data = [
      name,
      `${formatNumber(prevDayRemaining)}`,
      `${formatNumber(dailyAdded)}`,
      `${formatNumber(amount)} Rwf`,
      `${formatNumber(totalAvailable)}`,
    ];
    totalCost = totalCost + parseFloat(amount);
    totalPrev = totalPrev + parseFloat(prevDayRemaining);
    totalAdded = totalAdded + parseFloat(dailyAdded);
    totalFinal = totalFinal + parseFloat(totalAvailable);
    inventoryData.push(data);
  }
  inventoryData.push([
    "Total",
    `${formatNumber(totalPrev)}`,
    `${formatNumber(totalAdded)}`,
    `${formatNumber(totalCost)} Rwf`,
    `${formatNumber(totalFinal)}`,
  ]);
  const inventoryOptions = {
    title: "Inventory",
    subtitle: "Daily Inventory Balancing.",
    width: 500,
    x: 0,
    y: 0,
    columnSpacing: 5,
    prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
    prepareRow: (row, indexColumn, indexRow, rectRow) =>
      pdfDoc.fontSize(8).font(PoppinsRegular),
  };

  // Ensure there's space before adding the inventory table
  ensureSpaceForNextSection(100);

  // Inventory Table
  await pdfDoc.table(
    {
      headers: inventoryData[0],
      rows: inventoryData.slice(1),
      widths: [null, null, null],
      headerBackgroundColor: "gray",
      stripe: true,
    },
    inventoryOptions,
  );

  // ======================================
  if (type === "drinks") {
    // crates section
    let totalCrates = 0;
    const cratesData = [["Customer", "Given Crates"]];

    const crates = await Crates.find({
      activeDay: activeDay.id,
      stock: stock.id,
      allReturned: false,
      distributionPoint: null,
      producer: null,
    });
    for (let crate of crates) {
      const products = crate.products;
      const remaining = products.filter(
        (p) => p.given > p.returned || p.remaining > 0,
      );
      let desc = "";
      let total = 0;
      for (let p of remaining) {
        desc = desc + `${p.name}: ${p.remaining}\n`;
        total = total + parseFloat(p.remaining);
      }
      totalCrates = totalCrates + parseFloat(total);
      let data = [crate.customerName, `${formatNumber(total)}`];
      cratesData.push(data);
    }
    cratesData.push(["Total", `${formatNumber(totalCrates)}`]);
    const cratesOptions = {
      title: "Rendered Crates",
      subtitle: "Daily Rendered Crates.",
      width: 500,
      x: 0,
      y: 0,
      columnSpacing: 5,
      prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
      prepareRow: (row, indexColumn, indexRow, rectRow) =>
        pdfDoc.fontSize(8).font(PoppinsRegular),
    };

    // Ensure there's space before adding the crates table
    ensureSpaceForNextSection(100);

    // Crates Table
    await pdfDoc.table(
      {
        headers: cratesData[0],
        rows: cratesData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: "gray",
        stripe: true,
      },
      cratesOptions,
    );

    // empty crates section
    let totalECrates = 0;
    const eCratesData = [["Name", "Total"]];

    const eCrates = await EmptyCrates.find({ stock: stock.id });
    for (let crate of eCrates) {
      totalECrates = totalECrates + parseFloat(crate.number);
      let data = [crate.name, `${formatNumber(crate.number)}`];
      eCratesData.push(data);
    }
    eCratesData.push(["Total", `${formatNumber(totalECrates)}`]);
    const eCratesOptions = {
      title: "Empty Crates",
      subtitle: "Daily Final Empty Crates.",
      width: 500,
      x: 0,
      y: 0,
      columnSpacing: 5,
      prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
      prepareRow: (row, indexColumn, indexRow, rectRow) =>
        pdfDoc.fontSize(8).font(PoppinsRegular),
    };

    // Ensure there's space before adding the empty crates table
    ensureSpaceForNextSection(100);

    // Empty Crates Table
    await pdfDoc.table(
      {
        headers: eCratesData[0],
        rows: eCratesData.slice(1),
        widths: [null, null, null],
        headerBackgroundColor: "gray",
        stripe: true,
      },
      eCratesOptions,
    );
  }

  // expenses section
  let totalExpenses = 0;
  const expensesData = [["Name", "Total"]];

  const expenses = await Expense.find({
    activeDay: activeDay.id,
    stock: stock.id,
  });

  for (let expense of expenses) {
    totalExpenses += parseFloat(expense.amount);
    let data = [expense.name, `${formatNumber(expense.amount)} Rwf`];
    expensesData.push(data);
  }

  expensesData.push(["Total", `${formatNumber(totalExpenses)} Rwf`]);

  const expensesOptions = {
    title: "Expenses",
    subtitle: "Daily Expenses.",
    width: 500,
    x: 0,
    y: 0,
    columnSpacing: 5,
    prepareHeader: () => pdfDoc.fontSize(8).font(PoppinsBold),
    prepareRow: (row, indexColumn, indexRow, rectRow) =>
      pdfDoc.fontSize(8).font(PoppinsRegular),
  };

  // Ensure there's space before adding the expenses table
  ensureSpaceForNextSection(100);

  // Expenses Table
  await pdfDoc.table(
    {
      headers: expensesData[0],
      rows: expensesData.slice(1),
      widths: [null, null, null],
      headerBackgroundColor: "gray",
      stripe: true,
    },
    expensesOptions,
  );

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
