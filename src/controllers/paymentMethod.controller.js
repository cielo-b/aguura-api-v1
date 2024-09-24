const httpStatus = require("http-status");

const {PaymentMethod} = require("../models");
const catchAsync = require("../utils/catchAsync");
const {getEntityById} = require("./sales.controller");

const newMethod = catchAsync(async (req, res) => {

  const {entityId, entityType, number, bankName, type, momoRegName, nameOnCard, bankRegName} = req.body;

  let entity = await getEntityById(entityType, entityId);

  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  // const methodName = name.replace(/\s/g, "").toLowerCase();

  // const method = await PaymentMethod.findOne({
  //   methodName,
  //   [entityType]: entity.id,
  // });

  // if (method) {
  //   return res.status(httpStatus.BAD_REQUEST).json({
  //     success: false,
  //     message: "Method Already Exist.",
  //   });
  // }

  const newMethod = await PaymentMethod.create({
    [entityType]: entity.id,
    type,
    number,
    bankName,
    momoRegName,
    bankRegName,
    nameOnCard
  });

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Method Added Successfully.",
    method: newMethod,
  });
});

const editMethod = catchAsync(async (req, res) => {
  const method = await PaymentMethod.findById(req.params.methodId);

  if (!method) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Method Not Found.",
    });
  }

  const {name, entityType, entityId} = req.body;
  const methodName = name.replace(/\s/g, "").toLowerCase();

  const _method = await PaymentMethod.findOne({
    methodName,
    [entityType]: entityId,
  });

  if (_method) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Method Elready Exist.",
    });
  }

  method.name = name;
  method.methodName = methodName;

  await method.save({validateBeforeSave: false});

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Method Edited Successfully.",
    method,
  });
});

const allmethods = catchAsync(async (req, res) => {
  const {entityType, entityId} = req.query;
  const methods = await PaymentMethod.find(
    {[entityType]: entityId},
    {methodName: 0},
  );

  return res.status(httpStatus.OK).json({
    success: true,
    methods,
  });
});

module.exports = {
  newMethod,
  editMethod,
  allmethods,
};
