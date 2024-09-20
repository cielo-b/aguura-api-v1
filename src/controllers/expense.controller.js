const httpStatus = require("http-status");

const { Expense } = require("../models");
const catchAsync = require("../utils/catchAsync");
const { checkActive } = require("./activeDay.controller");
const { getEntityById } = require("./sales.controller");

const newExpense = catchAsync(async (req, res) => {
  const { entityId, entityType, dayId, name, amount } = req.body;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const activeDay = await checkActive(dayId);
  if (!activeDay) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Active Day Not Found.",
    });
  }

  const expense = await Expense.create({
    [entityType]: entityId,
    activeDay: dayId,
    name,
    amount,
  });

  if (!expense) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Something Went Wrong, Plz Try Again.",
    });
  }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Expense Recorded Successfully.",
  });
});

const editExpense = catchAsync(async (req, res) => {
  const { name, amount, id } = req.body;

  const expense = await Expense.findById(id);
  if (!expense) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Expense Not Found.",
    });
  }

  expense.name = name ? name : expense.name;
  expense.amount = amount ? amount : expense.amount;

  await expense.save({ validateBeforeSave: false });

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Expense Edited Successfully.",
  });
});

const allExpenses = catchAsync(async (req, res) => {
  const { entityId, entityType } = req.query;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const expenses = await Expense.find({ [entityType]: entityId });

  return res.status(httpStatus.OK).json({
    success: true,
    expenses,
  });
});

const dailyExpenses = catchAsync(async (req, res) => {
  const { entityId, entityType, dayId } = req.query;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const expenses = await Expense.find({
    [entityType]: entityId,
    activeDay: dayId,
  });

  return res.status(httpStatus.OK).json({
    success: true,
    expenses,
  });
});

module.exports = {
  newExpense,
  editExpense,
  allExpenses,
  dailyExpenses,
};
