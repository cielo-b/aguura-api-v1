const httpStatus = require("http-status");
const fs = require("fs");
const path = require("path");

const {
  InventoryProduct,
  Product,
  DistributionPoint,
  Producer,
  SalesProduct,
  User,
} = require("../models");
const catchAsync = require("../utils/catchAsync");
const {checkStock} = require("./stock.controller");
const config = require("../config/config");
const {ebmService} = require("../services");
const {getEntityById} = require("./sales.controller");

const generateEBMRequestData = (product, manager, entity, number) => {
  const {itemCd, pkgUnitCd, qtyUnitCd, nmbr} = ebmService.generateItemCode(
    entity.type,
    manager?.countryCode || "RW",
    2,
    number,
  );

  const data = {
    tin: manager.tin,
    bhfId: manager.bhfId,
    itemCd,
    itemClsCd: "5059690800",
    itemTyCd: "2",
    itemNm: product.name,
    itemStdNm: null,
    orgnNatCd: product.orgnNatCd || "RW",
    pkgUnitCd,
    qtyUnitCd,
    taxTyCd: "B",
    btchNo: null,
    bcd: null,
    dftPrc: product.price,
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
    modrNm: manager.fullName,
    modrId: manager.id.slice(0, 20),
    nmbr,
  };

  return data;
};

// ========= Distributor Products =========

const addDistributorProducts = catchAsync(async (req, res) => {
  const distributorId = req.query.distributorId;
  const distributionPoint = await DistributionPoint.findById(distributorId);

  if (!distributionPoint) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distribution Point Not Found.",
    });
  }

  const manager = await User.findById(distributionPoint.manager);

  const {products, isByProducer} = req.body;
  let producers = [];
  let _products = [];
  let savedProducts = [];

  for (let p of products) {
    const productName = p.name.replace(/\s/g, "").toLowerCase();
    if (isByProducer) {
      const product = await Product.findById(p.productId);
      if (product) {
        producers.push(product.producer);
        _products.push({
          productName,
          taxTyCd: product.taxTyCd,
          name: product.name,
          product: product.id,
          price: product.price,
          salePrice: p.price,
          distributionPoint: distributionPoint.id,
        });
      }
    } else {
      _products.push({
        productName,
        taxTyCd: p.taxTyCd,
        name: p.name,
        price: p.purchasePrice,
        salePrice: p.price,
        distributionPoint: distributionPoint.id,
      });
    }
  }
  for (let p of _products) {
    const product = await InventoryProduct.findOne({
      productName: p.productName,
      distributionPoint: distributionPoint.id,
    });
    if (product) {
      continue;
    }
    const iP = await InventoryProduct.create(p);
    if (iP) {
      savedProducts.push(iP);
      await SalesProduct.create({
        distributionPoint: distributionPoint.id,
        price: p.salePrice,
        inventoryProduct: iP.id,
      });
    }
  }

  producers = Array.from(new Set(producers));
  for (let p of producers) {
    const producer = await Producer.findById(p);
    if (producer) {
      let distributionPoints = producer.distributionPoints;
      if (
        !distributionPoints.some((dp) => dp.id.equals(distributionPoint.id))
      ) {
        distributionPoints.push({
          id: distributionPoint.id,
          totalOrders: parseFloat("0"),
        });
      }
      await producer.save({validateBeforeSave: false});
    }
  }

  const currentProducts = await InventoryProduct.find({
    distributionPoint: distributionPoint.id,
  });

  // save products to ebm
  if (manager.country === "rwanda") {
    for (let i = 0; i < savedProducts.length; i++) {
      const product = savedProducts[i];

      const data = generateEBMRequestData(
        product,
        manager,
        distributionPoint,
        currentProducts.length + i + 1,
      );

      const response = await ebmService.saveItems(data);

      if (response && response.resultCd === "000") {
        product.itemCd = itemCd;
        product.itemClsCd = data.itemClsCd;
        product.itemTyCd = data.itemTyCd;
        product.orgnNatCd = data.orgnNatCd;
        product.pkgUnitCd = pkgUnitCd;
        product.qtyUnitCd = qtyUnitCd;

        await product.save({validateBeforeSave: false});
      } else {
        // delete product if not recorded into ebm servers
        const salesProduct = await SalesProduct.findOne({
          inventoryProduct: product.id,
          stock: stock.id,
        });
        if (salesProduct) {
          await salesProduct.deleteOne();
        }
        await product.deleteOne();
      }
    }
  }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: `${products.length > 0 ? "Products Added Successfully." : "Product Added Successfully."}`,
  });
});

const getDistributorProducts = catchAsync(async (req, res) => {
  const distributorId = req.query.distributorId;
  const distributionPoint = await DistributionPoint.findById(distributorId);

  if (!distributionPoint) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distribution Point Not Found.",
    });
  }

  const manager = await User.findById(distributionPoint.manager);

  let products = await InventoryProduct.find({
    distributionPoint: distributionPoint.id,
  });

  // find ebm items
  const response = await ebmService.selectItems({
    tin: manager.tin.toString(),
    bhfId: manager.bhfId,
    lastReqDt: `20130101000000`,
  });
  const productKeys = new Set(
    products.map(
      (product) => `${product.itemCd}-${product.itemClsCd}-${product.name}`,
    ),
  );
  const ebmItemsWithoutProducts = (
    response.resultCd === "000" ? response.data?.itemList : []
  ).filter((item) => {
    const itemKey = `${item.itemCd}-${item.itemClsCd}-${item.itemNm}`;
    return !productKeys.has(itemKey);
  });

  products = await Promise.all(
    products.map(async (p) => {
      const product = await Product.findById(p.product);
      const saleProduct = await SalesProduct.findOne({
        inventoryProduct: p._id,
      });
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        producer: product?.producer,
        totalAvailable: p.totalAvailable,
        productName: p.productName,
        sellingPrice: saleProduct?.price,
      };
    }),
  );

  return res.status(httpStatus.CREATED).json({
    success: true,
    products,
    ebmItems: ebmItemsWithoutProducts,
  });
});

// ========= Stock Products =========

const newStockProduct = catchAsync(async (req, res) => {
  const stockId = req.query.stockId;
  const stock = await checkStock(stockId);

  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  const manager = await User.findById(stock.admin);

  const {name, price, purchasePrice, sizes, details, description, taxTyCd} =
    req.body;

  const productName = name.replace(/\s/g, "").toLowerCase();
  const existing = await InventoryProduct.findOne({
    productName,
    stock: stock.id,
  });
  if (existing) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      messsage: "Product Already Exists",
    });
  }

  // images
  const images =
    req.files.length > 0
      ? req.files.map((file) => {
        return {
          url: config.url + "/public/images/" + file.filename,
        };
      })
      : [];

  const iP = await InventoryProduct.create({
    productName,
    images,
    sizes: stock?.type === "fashion" ? JSON.parse(sizes) : [],
    details: stock?.type === "fashion" ? JSON.parse(details) : [],
    name,
    price: purchasePrice,
    stock: stock.id,
    description,
  });

  const currentProducts = await InventoryProduct.find({stock: stock.id});

  // if (iP) {
  //     if (manager.country === 'rwanda') {
  //         const product = iP;

  //         const data = generateEBMRequestData(product, manager, stock, (currentProducts.length + i + 1));

  //         const response = await ebmService.saveItems(data);

  //         if (response && response.resultCd === '000') {
  //             product.itemCd = itemCd;
  //             product.itemClsCd = data.itemClsCd;
  //             product.itemTyCd = data.itemTyCd;
  //             product.orgnNatCd = data.orgnNatCd;
  //             product.pkgUnitCd = pkgUnitCd;
  //             product.qtyUnitCd = qtyUnitCd;

  //             await product.save({validateBeforeSave: false});
  //             await SalesProduct.create({stock: stock.id, price, inventoryProduct: iP.id});
  //         } else {
  //             // delete product if not recorded into ebm servers
  //             const salesProduct = await SalesProduct.findOne({inventoryProduct: product.id, stock: stock.id});
  //             if (salesProduct) {
  //                 await salesProduct.deleteOne();
  //             }
  //             await product.deleteOne();
  //         }
  //     }
  // }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: `Product Added Successfully.`,
  });
});

const edit = catchAsync(async (req, res) => {
  const product = await InventoryProduct.findById(req.params.productId);

  if (!product) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Product Not Found.",
    });
  }

  const {
    name,
    price,
    sizes,
    details,
    description,
    images: existingImages,
    removedImages,
  } = req.body;

  const productName = name.replace(/\s/g, "").toLowerCase();
  const existing = await InventoryProduct.findOne({
    productName,
    stock: product.stock,
  });
  if (existing && existing._id.toString() !== product._id.toString()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      messsage: "Product Name Is Taken",
    });
  }

  const pPrice = price ? price : product.price;
  const pName = name ? name : product.name;
  product.price = pPrice;
  product.name = pName;
  product.productName = productName;
  product.description = description;
  product.details = JSON.parse(details);
  product.sizes = JSON.parse(sizes);

  await product.save({validateBeforeSave: false});

  // images
  for (let i of JSON.parse(removedImages)) {
    const filename = path.basename(new URL(i.url).pathname);
    // Construct the file path without specifying the full path
    const filePath = path.join("public", "images", filename);

    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      } else {
        console.log(`File ${filePath} deleted successfully.`);
      }
    });
  }

  let images =
    req.files.length > 0
      ? req.files.map((file) => {
        return {
          url: config.url + "/public/images/" + file.filename,
        };
      })
      : [];

  for (let img of JSON.parse(existingImages)) {
    images.push({url: img.url});
  }

  product.images = images;
  await product.save({validateBeforeSave: false});

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: `Product Edited Successfully.`,
  });
});

const addStockProducts = catchAsync(async (req, res) => {
  const stockId = req.query.stockId;
  const stock = await checkStock(stockId);

  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  const manager = await User.findById(stock.admin);

  const {products, isByProducer} = req.body;
  let _products = [];
  let producers = [];
  let savedProducts = [];
  for (let p of products) {
    const productName = p.name.replace(/\s/g, "").toLowerCase();
    if (isByProducer) {
      const product = await InventoryProduct.findById(p.productId);
      const saleProduct = await SalesProduct.findOne({
        inventoryProduct: product.id,
      });
      if (product) {
        producers.push(product.producer);
        _products.push({
          productName,
          // taxTyCd: product.taxTyCd,
          taxTyCd: "B",
          name: product.name,
          product: product.product || null,
          salePrice: p.price,
          price: saleProduct.price,
          stock: stock.id,
        });
      }
    } else {
      _products.push({
        productName,
        taxTyCd: "B",
        name: p.name,
        salePrice: p.price,
        price: p.purchasePrice,
        stock: stock.id,
      });
    }
  }
  for (let p of _products) {
    const product = await InventoryProduct.findOne({
      productName: p.productName,
      stock: stock.id,
    });
    if (product) {
      continue;
    }
    const iP = await InventoryProduct.create(p);
    if (iP) {
      savedProducts.push(iP);
      await SalesProduct.create({
        stock: stock.id,
        price: p.salePrice,
        inventoryProduct: iP.id,
      });
    }
  }

  producers = Array.from(new Set(producers));
  for (let p of producers) {
    const producer = await Producer.findById(p);
    if (producer) {
      let stocks = producer.stocks;
      if (!stocks.some((dp) => dp.id.equals(stock.id))) {
        stocks.push({id: stock.id, totalOrders: parseFloat("0")});
      }
      await producer.save({validateBeforeSave: false});
    }
  }

  const currentProducts = await InventoryProduct.find({stock: stock.id});

  // save products to ebm
  // if (manager.country === 'rwanda') {
  //     for (let i = 0; i < savedProducts.length; i++) {

  //         const product = savedProducts[i];

  //         const data = generateEBMRequestData(product, manager, stock, (currentProducts.length + i + 1));

  //         const response = await ebmService.saveItems(data);

  //         if (response && response.resultCd === '000') {
  //             product.itemCd = data.itemCd;
  //             product.itemClsCd = data.itemClsCd;
  //             product.itemTyCd = data.itemTyCd;
  //             product.orgnNatCd = data.orgnNatCd;
  //             product.pkgUnitCd = data.pkgUnitCd;
  //             product.qtyUnitCd = data.qtyUnitCd;
  //             product.nmbr = data.nmbr;

  //             await product.save({validateBeforeSave: false});
  //         } else {
  //             // delete product if not recorded into ebm servers
  //             const salesProduct = await SalesProduct.findOne({inventoryProduct: product.id, stock: stock.id});
  //             if (salesProduct) {
  //                 await salesProduct.deleteOne();
  //             }
  //             await product.deleteOne();
  //         }
  //     }
  // }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: `${products.length > 0 ? "Products Added Successfully." : "Product Added Successfully."}`,
  });
});

const getStockProducts = catchAsync(async (req, res) => {
  const stockId = req.query.stockId;
  const stock = await checkStock(stockId);

  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  const manager = await User.findById(stock.admin);

  let products = await InventoryProduct.find({stock: stock.id});

  // const response = await ebmService.selectItems({
  //     tin: manager.tin.toString(),
  //     bhfId: manager.bhfId,
  //     lastReqDt: `20130101000000`
  // });

  // const productKeys = new Set(products.map(product => `${product.itemCd}-${product.itemClsCd}-${product.name}`));
  // const ebmItemsWithoutProducts = (response.resultCd === '000' ? response.data?.itemList : []).filter(item => {
  //     const itemKey = `${item.itemCd}-${item.itemClsCd}-${item.itemNm}`;
  //     return !productKeys.has(itemKey);
  // });

  products = await Promise.all(
    products.map(async (p) => {
      const product = await Product.findOne({productName: p.productName});
      const salesP = await SalesProduct.findOne({inventoryProduct: p._id});
      return {
        id: p._id,
        name: p.name,
        price: p.price,
        producer: product?.producer,
        totalAvailable: p.totalAvailable,
        inOrders: p.inOrders,
        images: p.images,
        sizes: p.sizes,
        details: p.details,
        description: p.description,
        sellingPrice: salesP?.price,
      };
    }),
  );

  return res.status(httpStatus.CREATED).json({
    success: true,
    products,
    // ebmItems: ebmItemsWithoutProducts
  });
});

// ============================================================================================

const editProduct = catchAsync(async (req, res) => {
  const product = await InventoryProduct.findById(req.params.productId);

  if (!product) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Product Not Found.",
    });
  }

  const {name, price} = req.body;
  const pPrice = price ? price : product.price;
  const pName = name ? name : product.name;
  product.price = pPrice;
  product.name = pName;

  await product.save({validateBeforeSave: false});

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Product Edited Successfully.",
    product,
  });
});

const allProducts = catchAsync(async (req, res) => {
  const stockId = req.query.stockId;
  const stock = await checkStock(stockId);

  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  let products = await InventoryProduct.find({stock: stock.id});
  products = await Promise.all(
    products.map(async (p) => {
      const product = await Product.findById(p.product);
      return {
        id: p._id,
        name: p.name,
        price: p.price,
        producer: product?.producer,
        totalAvailable: p.totalAvailable,
      };
    }),
  );

  return res.status(httpStatus.CREATED).json({
    success: true,
    products,
  });
});

const importEbmProducts = catchAsync(async (req, res) => {
  const {entityType, entityId, ebmItems} = req.body;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity not found.",
    });
  }

  for (let _item of ebmItems) {
    const item = JSON.parse(_item.item);

    const productName = item.itemNm.replace(/\s/g, "").toLowerCase();
    const product = await InventoryProduct.findOne({
      [entityType]: entityId,
      productName,
    });

    if (!product) {
      const inventoryProduct = await InventoryProduct.create({
        [entityType]: entityId,
        name: item.itemNm,
        productName,
        price: _item.price,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemTyCd: item.itemTyCd,
        orgNatCd: item.orgNatCd,
        pkgUnitCd: item.pkgUnitCd,
        qtyUnitCd: item.qtyUnitCd,
        dailyAdded: _item.quantity,
        totalAvailable: _item.quantity,
        taxTyCd: _item.taxTyCd,
        nmbr: item.itemCd.slice(-7),
      });

      if (inventoryProduct) {
        const sp = await SalesProduct.create({
          price: item.dftPrc,
          inventoryProduct: inventoryProduct.id,
          [entityType]: entityId,
        });

        if (!sp) {
          await inventoryProduct.deleteOne();
        }
      }
    }
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: "EBM Products Imported Successfully.",
  });
});

module.exports = {
  addDistributorProducts,
  getDistributorProducts,
  newStockProduct,
  edit,
  addStockProducts,
  getStockProducts,
  editProduct,
  allProducts,
  importEbmProducts,
};
