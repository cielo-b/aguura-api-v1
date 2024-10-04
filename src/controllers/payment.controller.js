const httpStatus = require("http-status");

const { Payment } = require("../models");
const catchAsync = require("../utils/catchAsync");
const { getEntityById } = require("./sales.controller");

const allPayments = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.query;

  let entity = await getEntityById(entityType, entityId);

  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  let queryObj = { [entityType]: entityId };
  if (entityType === "distributionPoint") {
    queryObj.producer = null;
  } else if (entityType === "stock") {
    queryObj.distributionPoint = null;
  }

  let payments = await Payment.find(queryObj, { activeDay: 0 }).populate(
    "method",
  );

  payments = payments.map((payment) => {
    return {
      id: payment.id,
      customerName: payment.customerName,
      customerPhone: payment.customerPhone,
      amount: payment.amount,
      date: payment.date,
      method: payment.method.type,
    };
  });

  return res.status(httpStatus.OK).json({
    success: true,
    payments,
  });
});

const dailyPayments = catchAsync(async (req, res) => {
  const { entityId, entityType, dayId } = req.query;
  let entity = await getEntityById(entityType, entityId);

  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }
  let queryObj = { [entityType]: entityId, activeDay: dayId };
  if (entityType === "distributionPoint") {
    queryObj.producer = null;
  } else if (entityType === "stock") {
    queryObj.distributionPoint = null;
  }
  let payments = await Payment.find(queryObj, { activeDay: 0 }).populate(
    "method",
  );

  payments = payments.map((payment) => {
    return {
      id: payment.id,
      customerName: payment.customerName,
      customerPhone: payment.customerPhone,
      amount: payment.amount,
      date: payment.date,
      method: payment.method.type,
    };
  });

  return res.status(httpStatus.OK).json({
    success: true,
    payments,
  });
});

module.exports = {
  allPayments,
  dailyPayments,
};
