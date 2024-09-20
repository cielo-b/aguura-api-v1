const httpStatus = require("http-status");

const catchAsync = require("../utils/catchAsync");
const { getEntityById } = require("./sales.controller");
const { InventoryProduct, EmptyCrates, Product } = require("../models");

const registerEmptyCrates = catchAsync(async (req, res) => {
  const { entityId, entityType, products } = req.body;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  for (let p of products) {
    const product =
      entityType !== "producer"
        ? await InventoryProduct.findById(p.id)
        : await Product.findById(p.id);
    if (product) {
      await EmptyCrates.create({
        [entityType]: entityId,
        name: product.name,
        product: product.id,
        number: parseFloat(p.number),
      });
    }
  }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Empty Crates Added Successfully.",
  });
});

const editEmptyCrate = catchAsync(async (req, res) => {
  const { id, number } = req.body;
  const crate = await EmptyCrates.findById(id);

  if (!crate) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Crate Not Found.",
    });
  }
  crate.number = parseFloat(number);
  await crate.save({ validateBeforeSave: false });
  return res.status(httpStatus.OK).json({
    success: true,
    message: "Edited Successfully.",
  });
});

const removeEmptyCrates = catchAsync(async (req, res) => {
  const { entityId, entityType, crates } = req.body;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  for (let c of crates) {
    const crate = await EmptyCrates.findById(c.id);
    if (crate) {
      crate.number -= parseFloat(c.number);
      await crate.save({ validateBeforeSave: false });
    }
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Empty Crates Removed Successfully.",
  });
});

const getEmptyCrates = catchAsync(async (req, res) => {
  const { entityId, entityType } = req.query;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const crates = await EmptyCrates.find({ [entityType]: entityId });

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Empty Crates Removed Successfully.",
    crates,
  });
});

module.exports = {
  registerEmptyCrates,
  editEmptyCrate,
  removeEmptyCrates,
  getEmptyCrates,
};
