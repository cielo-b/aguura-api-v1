const httpStatus = require("http-status");

const {
  InventoryProduct,
  SalesProduct,
  Product,
  User,
  Producer,
  Stock,
  DistributionPoint,
} = require("../models");
const catchAsync = require("../utils/catchAsync");
const { checkStock } = require("./stock.controller");
const { getEntityById } = require("./sales.controller");
const { ebmService } = require("../services");

const newProduct = catchAsync(async (req, res) => {
  const stockId = req.query.stockId;
  const stock = await checkStock(stockId);

  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  const { products } = req.body;

  for (let p of products) {
    const product = await InventoryProduct.findById(p.productId);
    if (!product) {
      continue;
    }
    const existingProduct = await SalesProduct.findOne({
      inventoryProduct: product.id,
    });
    if (existingProduct) {
      continue;
    }
    await SalesProduct.create({
      inventoryProduct: product.id,
      price: p.price,
      stock: stock.id,
    });
  }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: `${products.length > 0 ? "Products Added Successfully." : "Product Added Successfully."}`,
  });
});

const editProduct = catchAsync(async (req, res) => {
  const product = await SalesProduct.findById(req.params.productId);
  const user = await User.findById(req.user._id);
  const stock = await Stock.findOne({ admin: user.id });
  const distributionPoint = await DistributionPoint.findOne({
    manager: user.id,
  });
  const producer = await Producer.findOne({ manager: user.id });

  const entity = stock
    ? stock
    : distributionPoint
      ? distributionPoint
      : producer;

  if (!product) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Product Not Found.",
    });
  }

  const { price } = req.body;

  product.price = price;

  await product.save({ validateBeforeSave: false });

  // update ebm product
  const inventoryProduct = await InventoryProduct.findById(
    product.inventoryProduct,
  );

  if (!inventoryProduct) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Inventory Product Not Found To Update EBM.",
    });
  }

  const data = {
    tin: user.tin,
    bhfId: user.bhfId,
    itemCd: inventoryProduct.itemCd,
    itemClsCd: inventoryProduct.itemClsCd,
    itemTyCd: inventoryProduct.itemTyCd,
    itemNm: inventoryProduct.name,
    itemStdNm: null,
    orgnNatCd: "RW",
    pkgUnitCd: inventoryProduct.pkgUnitCd,
    qtyUnitCd: inventoryProduct.qtyUnitCd,
    taxTyCd: inventoryProduct.taxTyCd,
    btchNo: null,
    bcd: null,
    dftPrc: price,
    grpPrcL1: null,
    grpPrcL2: null,
    grpPrcL3: null,
    grpPrcL4: null,
    grpPrcL5: null,
    addInfo: null,
    sftyQty: null,
    isrcAplcbYn: "N",
    useYn: "Y",
    regrNm: entity.name,
    regrId: entity.id.slice(0, 20),
    modrNm: user.fullName,
    modrId: user.id.slice(0, 20),
  };

  console.log(data);
  const response = await ebmService.saveItems(data);

  console.log(response);

  if (response.resultCd !== "00") {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: true,
      message: response.resultMsg,
    });
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Product Edited Successfully.",
  });
});

const allProducts = catchAsync(async (req, res) => {
  const entity = await getEntityById(req.query.entityType, req.query.entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const products = await SalesProduct.find({
    [req.query.entityType]: req.query.entityId,
  });
  let resProducts = [];

  for (let i = 0; i < products.length; i++) {
    const ip = await InventoryProduct.findById(products[i].inventoryProduct);
    const product = await Product.findOne({ productName: ip.productName });
    resProducts.push({
      name: ip.name,
      price: products[i].price,
      id: products[i]._id,
      inventoryProduct: ip.id,
      producer: product?.producer,
      images: ip.images,
      sizes: ip.sizes,
      details: ip.details,
      description: ip.description,
    });
  }

  return res.status(httpStatus.OK).json({
    success: true,
    products: resProducts,
  });
});

const availableProducts = catchAsync(async (req, res) => {
  let products = await SalesProduct.find({ stock: req.query.stockId });

  products = await Promise.all(
    products.map(async (product) => {
      const inProduct = await InventoryProduct.findById(
        product.inventoryProduct,
      );
      if (parseFloat(inProduct.totalAvailable) > 0) {
        const producerProduct = await Product.findById(inProduct.product);
        return {
          name: inProduct.name,
          price: product.price,
          id: product._id,
          number: inProduct.totalAvailable,
          producer: producerProduct?.producer,
          images: inProduct.images,
          sizes: inProduct.sizes,
          details: inProduct.details,
          description: inProduct.description,
        };
      }
    }),
  );

  products = products.filter((p) => p !== undefined);

  return res.status(httpStatus.OK).json({
    success: true,
    products,
  });
});

module.exports = {
  newProduct,
  editProduct,
  allProducts,
  availableProducts,
};
