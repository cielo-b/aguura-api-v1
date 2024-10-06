const httpStatus = require("http-status");

const {
  Credit,
  Sales,
  PaymentMethod,
  Payment,
  Producer,
  DistributionPoint,
} = require("../models");
const catchAsync = require("../utils/catchAsync");
const formatNumber = require("../utils/formatNumber");

const payCredit = catchAsync(async (req, res) => {
  const { creditId, amount, payments, activeDay } = req.body;

  const credit = await Credit.findById(creditId);
  const sales = await Sales.findById(credit.sales);

  if (!credit) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Credit Not Found.",
    });
  }

  if (amount > 0) {
    if (payments.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Plz Add How User Paid.",
      });
    } else {
      let total = 0;
      for (const p of payments) {
        total += parseInt(p.amount);
      }
      if (parseInt(total) !== parseInt(amount)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message:
            "Amount From All Methods Has To Be Equal To Total Amount Paid.",
        });
      }
    }
  }

  let desc = ``;

  credit.amountPaid = parseInt(credit.amountPaid) + parseInt(amount);
  sales.amountPaid = parseInt(sales.amountPaid) + parseInt(amount);

  if (credit.amountPaid >= credit.totalAmount) {
    credit.isFullyPaid = true;
  }
  if (credit.isFullyPaid) {
    sales.isFullyPaid = true;
  }

  await credit.save({ validateBeforeSave: false });
  await sales.save({ validateBeforeSave: false });

  if (payments.length > 0) {
    for (const payment of payments) {
      desc = `${payment.name}: ${formatNumber(payment.amount)} Rwf\n`;
      let method = await PaymentMethod.findById(payment.id);
      await Payment.create({
        activeDay: activeDay,
        method: method.id,
        customerName: credit.customerName,
        customerPhone: credit.customerPhone,
        amount: payment.amount,
        stock: credit.stock,
        customer: credit.customer,
        sale: credit.sale,
        credit: credit.id,
        isCreditPayment: true,
      });
    }
  }
  const spd = sales.paymentDescription.replace(/\s/g, "").toLowerCase();
  sales.paymentDescription =
    spd !== "nopaymentsyet." ? sales.paymentDescription + desc : desc;
  await sales.save({ validateBeforeSave: false });

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Credit Paid Successfully.",
  });
});

const adminCredits = catchAsync(async (req, res) => {
  const { isFullyPaid, entityType, entityId } = req.query;

  const credits =
    entityType === "producer"
      ? await Credit.find({ isFullyPaid, [entityType]: entityId })
      : entityType === "distributionPoint"
        ? await Credit.find({
            isFullyPaid,
            [entityType]: entityId,
            producer: { $eq: null },
          })
        : await Credit.find({
            isFullyPaid,
            [entityType]: entityId,
            distributionPoint: { $eq: null },
            producer: { $eq: null },
          });

  return res.status(httpStatus.OK).json({
    success: true,
    credits,
  });
});

const myCredits = catchAsync(async (req, res) => {
  const credits = await Credit.find({
    isFullyPaid: req.query.isFullyPaid,
    customer: req.user._id,
  })
    .populate("sales")
    .populate("stock");

  // for each credit stock only return the name  and stock id
  credits.forEach((credit) => {
    credit.stock = {
      name: credit.stock.name,
      id: credit.stock._id,
    };
  });
  return res.status(httpStatus.OK).json({
    success: true,
    credits,
  });
});

const entityCredits = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.query;

  let credits =
    entityType === "distributionPoint"
      ? await Credit.find({
          isFullyPaid: false,
          [entityType]: entityId,
          producer: { $ne: null },
        })
      : await Credit.find({
          isFullyPaid: false,
          [entityType]: entityId,
          distributionPoint: { $ne: null },
          producer: { $eq: null },
        });

  credits = await Promise.all(
    credits.map(async (credit) => {
      if (entityType === "distributionPoint") {
        const producer = await Producer.findById(credit.producer).populate(
          "manager",
        );

        return {
          name: producer.name,
          phone: producer.manager.phone,
          description: credit.description,
          totalAmount: credit.totalAmount,
          amountPaid: credit.amountPaid,
        };
      } else {
        const distributor = await DistributionPoint.findById(
          credit.distributionPoint,
        ).populate("manager");

        return {
          name: distributor.name,
          phone: distributor.manager.phone,
          description: credit.description,
          totalAmount: credit.totalAmount,
          amountPaid: credit.amountPaid,
        };
      }
    }),
  );

  return res.status(httpStatus.OK).json({
    success: true,
    credits,
  });
});

module.exports = {
  payCredit,
  adminCredits,
  myCredits,
  entityCredits,
};
