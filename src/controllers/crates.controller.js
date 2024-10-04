const httpStatus = require("http-status");

const {
  Crates,
  User,
  Stock,
  InventoryProduct,
  DistributionPoint,
  Producer,
  Product,
  EmptyCrates,
} = require("../models");
const catchAsync = require("../utils/catchAsync");
const { checkDay } = require("./activeDay.controller");
const { getEntityById } = require("./sales.controller");

const newCratesRender = catchAsync(async (req, res) => {
  const { entityId, entityType, products: reqProducts, customerId } = req.body;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const activeDay = await checkDay({ entityId, entityType });

  let user = await User.findById(customerId);
  let stock = await Stock.findById(customerId).populate("admin");
  let distributor =
    await DistributionPoint.findById(customerId).populate("manager");

  const customerName = user
    ? user.fullName
    : stock
      ? stock.name
      : distributor
        ? distributor.name
        : req.body.customerName;
  const customerPhone = user
    ? user.phone
    : stock
      ? stock.admin.phone
      : distributor
        ? distributor.manager.phone
        : req.body.customerPhone;

  let products = await Promise.all(
    reqProducts.map(async (p) => {
      if (entityType === "producer") {
        const iP = await Product.findById(p.id);

        // update empty
        const iProduct = await InventoryProduct.findOne({ product: iP?._id });
        if (iProduct) {
          const eCrate = await EmptyCrates.findOne({ product: iProduct._id });
          if (eCrate) {
            eCrate.number -= parseFloat(p.given);
            await eCrate.save({ validateBeforeSave: false });
          }
        }

        return {
          id: p.id,
          given: p.given,
          name: iP?.name,
          remaining: p.given,
        };
      } else {
        const iP = await InventoryProduct.findById(p.id);
        // update empty
        if (iP) {
          const eCrate = await EmptyCrates.findOne({ product: iP._id });
          if (eCrate) {
            eCrate.number -= parseFloat(p.given);
            await eCrate.save({ validateBeforeSave: false });
          }
        }
        return {
          id: p.id,
          given: p.given,
          name: iP?.name,
          remaining: p.given,
        };
      }
    }),
  );

  let obj = {
    products,
    customerName,
    customerPhone,
    activeDay: activeDay.id,
  };

  if (entityType === "stock") {
    obj.stock = entity._id;
    obj.customer = user && user.id;
    obj.renderedTo = user ? user.id : null;
  } else if (entityType === "distributionPoint") {
    obj.renderedTo = stock && stock.id;
    obj.distributionPoint = entity._id;
  } else if (entityType === "producer") {
    obj.renderedTo = distributor && distributor.id;
    obj.producer = entity._id;
  }

  const crates = await Crates.create(obj);

  if (!crates) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Something Went Wrong, Plz Try Again.",
    });
  }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Crates Recorded Successfully.",
  });
});

const editCrates = catchAsync(async (req, res) => {
  const { products: reqProducts, id } = req.body;

  let crates = await Crates.findById(id);
  if (!crates) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Crates Not Found.",
    });
  }

  const initials = crates.products.map((p) => {
    return {
      id: p.id,
      number: p.remaining,
    };
  });

  // update empt
  for (let i of initials) {
    const iP = await InventoryProduct.findById(i.id);
    // update empty
    if (iP) {
      const eCrate = await EmptyCrates.findOne({ product: iP._id });
      if (eCrate) {
        eCrate.number += parseFloat(p.given);
        await eCrate.save({ validateBeforeSave: false });
      }
    }
  }

  let products = await Promise.all(
    reqProducts.map(async (p) => {
      if (crates.producer) {
        const iP = await Product.findById(p.id);

        // update empty
        const iProduct = await InventoryProduct.findOne({ product: iP?._id });
        if (iProduct) {
          const eCrate = await EmptyCrates.findOne({ product: iProduct._id });
          if (eCrate) {
            eCrate.number -= parseFloat(p.given);
            await eCrate.save({ validateBeforeSave: false });
          }
        }

        return {
          id: p.id,
          given: p.given,
          name: iP?.name,
          remaining: p.given,
        };
      } else {
        const iP = await InventoryProduct.findById(p.id);
        // update empty
        if (iP) {
          const eCrate = await EmptyCrates.findOne({ product: iP._id });
          if (eCrate) {
            eCrate.number -= parseFloat(p.given);
            await eCrate.save({ validateBeforeSave: false });
          }
        }
        return {
          id: p.id,
          given: p.given,
          name: iP?.name,
          remaining: p.given,
        };
      }
    }),
  );

  crates.products = products;
  await crates.save({ validateBeforeSave: false });

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Crates Edited Successfully.",
  });
});

const allCrates = catchAsync(async (req, res) => {
  const { entityId, entityType, allReturned } = req.query;
  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }
  const crates = await Crates.find({ allReturned, [entityType]: entityId });

  return res.status(httpStatus.OK).json({
    success: true,
    crates,
  });
});

const returnCrates = catchAsync(async (req, res) => {
  const cratesOrder = await Crates.findById(req.params.id);
  if (!cratesOrder) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Crates Order Not Found.",
    });
  }

  const { products } = req.body;
  const crates = cratesOrder.products;

  let updatedCrates = [];
  let allReturned = true;

  for (let crate of crates) {
    const product = products.find((p) => p.id === crate.id);
    if (product) {
      let updtC = {
        id: crate.id,
        name: crate.name,
        given: crate.given,
        returned: parseFloat(crate.returned) + parseFloat(product.number),
        remaining:
          parseFloat(crate.given) -
          parseFloat(parseFloat(crate.returned) + parseFloat(product.number)),
      };
      updatedCrates.push(updtC);
    } else {
      updatedCrates.push(crate);
    }
  }

  const upc = updatedCrates.filter((c) => c.remaining > 0);
  if (upc.length > 0) allReturned = false;

  cratesOrder.products = updatedCrates;
  cratesOrder.allReturned = allReturned;

  // Update Empty Crates
  for (let p of products) {
    const iP = await InventoryProduct.findById(p.id);
    const eCrate = await EmptyCrates.findOne({ product: iP._id });
    if (eCrate) {
      eCrate.number += parseFloat(p.number);
      await eCrate.save({ validateBeforeSave: false });
    }
  }

  await cratesOrder.save({ validateBeforeSave: false });

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Crates Were Returned Successfully.",
  });
});

const myCrates = catchAsync(async (req, res) => {
  const { entityId, entityType } = req.query;
  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  let crates = await Crates.find({ allReturned: false, renderedTo: entityId });

  crates = await Promise.all(
    crates.map(async (crate) => {
      if (entityType === "user") {
        const stock = await Stock.findById(crate.stock).populate("admin");
        return {
          id: crate.id,
          name: stock?.name,
          products: crate.products,
          phone: stock.admin?.phone,
        };
      } else if (entityType === "stock") {
        const distributor = await DistributionPoint.findById(
          crate.distributionPoint,
        ).populate("manager");
        return {
          id: crate.id,
          name: distributor?.name,
          products: crate.products,
          phone: distributor.manager?.phone,
        };
      } else if (entityType === "distributionPoint") {
        const producer = await Producer.findById(crate.producer).populate(
          "manager",
        );
        return {
          id: crate.id,
          name: producer?.name,
          products: crate.products,
          phone: distributor.manager?.phone,
        };
      }
    }),
  );

  return res.status(httpStatus.OK).json({
    success: true,
    crates,
  });
});

module.exports = {
  newCratesRender,
  editCrates,
  allCrates,
  returnCrates,
  myCrates,
};
