const httpStatus = require("http-status");

const {
  InventoryProduct,
  SalesProduct,
  Sales,
  Credit,
  User,
  Order,
  Payment,
  PaymentMethod,
  DistributionPoint,
  Producer,
  Product,
  ActiveDay,
  Inventory,
  Stock,
  EmptyCrates,
} = require("../models");
const catchAsync = require("../utils/catchAsync");
const formatNumber = require("../utils/formatNumber");
const {checkDay, checkActive} = require("./activeDay.controller");
const {checkStock} = require("./stock.controller");
const sendPushNotification = require("../utils/fcmSendPushNotifications");
const {validateTotalPayments, getEntityById} = require("./sales.controller");

const completeOrder = catchAsync(async (req, res) => {
  const {entityType, entityId, id, payments, amountPaid, isFullyPaying} =
    req.body;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const order = await Order.findById(id).populate("customer");
  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Order Not Found.",
    });
  }

  const activeDay = await checkDay({entityId, entityType});

  if (!isFullyPaying && !amountPaid) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Plz Add How Much User Paid.",
    });
  }
  if (amountPaid > 0) {
    if (payments.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Plz Add How User Paid.",
      });
    } else if (!validateTotalPayments(payments, amountPaid)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message:
          "Amount From All Methods Has To Be Equal To Total Amount Paid.",
      });
    } else if (
      isFullyPaying &&
      !(parseFloat(amountPaid) === parseFloat(order.totalPrice))
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: `Amount Has To Be Equal To ${formatNumber(order.totalPrice)}`,
      });
    }
  }

  let _payments = [];
  let paymentDescription = ``;

  if (payments.length > 0) {
    for (let payment of payments) {
      let method = await PaymentMethod.findById(payment.id);
      const _payment = {
        id: method.id,
        name: method.type,
        amount: payment.amount,
      };
      _payments.push(_payment);
      paymentDescription =
        paymentDescription +
        `${_payment.name}: ${formatNumber(_payment.amount)} Rwf \n`;
    }
  } else {
    paymentDescription = "No Payments Yet.";
  }

  if (
    isFullyPaying &&
    parseFloat(amountPaid) !== parseFloat(order.totalPrice)
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: `Amount Has To Be ${formatNumber(order.totalPrice)} Rwf`,
    });
  }

  // handle amount
  let paid = parseFloat(order.totalPrice) === parseFloat(amountPaid);

  let obj = {
    activeDay: activeDay.id,
    products: order.products,
    totalPrice: order.totalPrice,
    isFullyPaid: paid,
    customerName: order.customerName,
    customerPhone: order.phone,
    amountPaid,
    description: order.description,
    [entityType]: entityId,
    payments: _payments,
    paymentDescription,
    fromOrder: true,
  };
  const sales = await Sales.create(obj);

  if (!sales) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Something Went Wrong, Plz Try Again.",
    });
  }

  if (entityType === "stock") {
    let producer = null;
    let total = 0;

    for (let i = 0; i < order.products.length; i++) {
      let reqProduct = order.products[i];
      let product = await SalesProduct.findById(reqProduct.id);
      let inventoryProduct = await InventoryProduct.findById(
        product.inventoryProduct,
      );

      const producerProduct = await Product.findById(inventoryProduct?.product);
      if (!producer) {
        if (producerProduct) {
          producer = await Producer.findById(producerProduct.producer);
        }
      }
      if (producer) {
        total += parseFloat(product.price) * parseFloat(reqProduct.quantity);
      }

      inventoryProduct.totalAvailable -= parseFloat(reqProduct.quantity);
      await inventoryProduct.save({validateBeforeSave: false});

      // update empty
      const eCrate = await EmptyCrates.findOne({
        product: inventoryProduct._id,
      });
      if (eCrate) {
        eCrate.number += parseFloat(reqProduct.quantity);
        await eCrate.save({validateBeforeSave: false});
      }
    }

    if (producer) {
      let customers = producer.customers;
      let stockIndex = customers.findIndex(
        (d) => d.id.toString() === order.customer.toString(),
      );

      if (stockIndex !== -1) {
        customers[stockIndex].totalPurchases -= parseFloat(iPurchase);
        customers[stockIndex].totalPurchases += parseFloat(total);
        producer.customers = customers;
        await producer.save({validateBeforeSave: false});
      }
    }
  } else if (entityType === "distributionPoint") {
    const reqProducts = order.products;
    const distributorProducts = await InventoryProduct.find({
      distributionPoint: order.distributionPoint,
    });

    for (let i = 0; i < reqProducts.length; i++) {
      let reqProduct = reqProducts[i];
      const distProduct = distributorProducts.find(
        (p) => p._id.toString() === reqProduct.id.toString(),
      );

      // === update dist products ===
      if (distProduct) {
        distProduct.totalAvailable -= parseFloat(reqProduct.quantity);
        await distProduct.save({validateBeforeSave: false});
      }
    }
  } else {
    const reqProducts = order.products;
    for (let i = 0; i < reqProducts.length; i++) {
      let reqProduct = reqProducts[i];
      const product = await Product.findById(reqProduct.id);

      // === update producer products ===
      if (product) {
        product.totalAvailable -= parseFloat(reqProduct.quantity);
        await product.save({validateBeforeSave: false});
      }
    }
  }

  // if not fully paid, create new credit
  if (!paid) {
    let obj = {
      customer: order.customer,
      activeDay: activeDay.id,
      sales: sales.id,
      totalAmount: order.totalPrice - amountPaid,
      customerName: order.customerName,
      customerPhone: order.phone,
      description: order.description,
      [entityType]: entityId,
    };
    if (entityType === "producer") {
      obj.distributionPoint = order.distributionPoint;
    } else if (entityType === "distributionPoint") {
      obj.stock = order.stock;
    }
    const credit = await Credit.create(obj);

    if (!credit) {
      return res.status(httpStatus.CREATED).json({
        success: true,
        message:
          "Order Completed Successfully But, Credit Failed To Be Recorder.",
      });
    }
  }

  if (payments.length > 0) {
    for (const payment of payments) {
      let method = await PaymentMethod.findById(payment.id);
      const obj = {
        activeDay: activeDay.id,
        method: method.id,
        customerName: order.customerName,
        customerPhone: order.phone,
        amount: payment.amount,
        [entityType]: entityId,
      };
      if (entityType === "producer") {
        obj.distributionPoint = order.distributionPoint;
      } else if (entityType === "distribution") {
        obj.stock = order.stock;
      }
      await Payment.create(obj);
    }
  }

  order.isCompleted = true;
  order.sale = sales.id;
  order.status = "completed";
  await order.save({validateBeforeSave: false});

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Order Completed Successfully.",
  });
});

const inventOrder = catchAsync(async (req, res) => {
  const {entityType, entityId, id, activeDay} = req.body;

  let entity = await getEntityById(entityType, entityId);
  if (!entity) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Entity Not Found.",
    });
  }

  const order = await Order.findById(id).populate("customer");
  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Order Not Found.",
    });
  }
  const sales = await Sales.findById(order.sale);

  const isActive = await checkActive(activeDay);
  if (!isActive) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Day Is Not Active.",
    });
  }
  // handle inventories
  let iProducts = [];
  let iTotalPrice = 0;
  let iDescription = ``;

  // update inventory products availability
  if (entityType === "distributionPoint") {
    const distributor = await DistributionPoint.findById(
      order.distributionPoint,
    );
    const distributionProducts = await InventoryProduct.find({
      distributionPoint: distributor._id,
    });
    const reqProducts = order.products;

    for (let product of distributionProducts) {
      const _product = reqProducts.find(
        (p) => p.id.toString() === product.product?.toString(),
      );
      if (_product) {
        const producerProduct = await Product.findById(product.product);
        const inventoryProduct = {
          name: product.name,
          quantity: parseFloat(_product.quantity),
          unitPrice: producerProduct.price,
          totalPrice: producerProduct.price * parseFloat(_product.quantity),
          id: product.id,
        };

        iProducts.push(inventoryProduct);
        iTotalPrice += inventoryProduct.totalPrice;
        iDescription =
          iDescription +
          `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
      }
    }

    const inventory = await Inventory.create({
      activeDay,
      products: iProducts,
      totalPrice: iTotalPrice,
      distributionPoint: distributor._id,
      description: iDescription,
    });
    if (inventory) {
      let producer = null;

      if (sales) {
        sales.inventory = inventory.id;
        await sales.save({validateBeforeSave: false});
      }

      // update inventory products availability
      for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findOne({
          distributionPoint: distributor._id,
          product: reqProduct.id,
        });

        product.totalAvailable += parseFloat(reqProduct.quantity);
        product.dailyAdded += parseFloat(reqProduct.quantity);
        await product.save({validateBeforeSave: false});

        // update empty

        // distributor
        const eCrate = await EmptyCrates.findOne({product: product._id});
        if (eCrate) {
          eCrate.number -= parseFloat(reqProduct.quantity);
          await eCrate.save({validateBeforeSave: false});
        }

        // producer
        const _product = await Product.findById(product.product);
        if (_product) {
          producer = await Producer.findById(_product.producer);
        }
        const _eCrate = await EmptyCrates.findOne({product: _product._id});
        if (_eCrate) {
          _eCrate.number += parseFloat(reqProduct.quantity);
          await _eCrate.save({validateBeforeSave: false});
        }
      }

      // Update distributor purchases
      if (producer) {
        let distributors = producer.distributionPoints;
        let distributorIndex = distributors.findIndex(
          (d) => d.id.toString() === distributor._id.toString(),
        );

        if (distributorIndex !== -1) {
          distributors[distributorIndex].totalPurchases += parseFloat(
            order.totalPrice,
          );
          entity.distributionPoints = distributors;
          await entity.save({validateBeforeSave: false});
        }
      }
    }
  } else if (entityType === "stock") {
    const stock = await Stock.findById(order.stock);
    const stockProducts = await InventoryProduct.find({stock: stock._id});
    const distributorProducts = await InventoryProduct.find({
      distributionPoint: order.distributionPoint,
    });
    const reqProducts = order.products;

    for (let product of stockProducts) {
      const distProduct = distributorProducts.find(
        (p) => p.productName === product.productName,
      );
      const _product = reqProducts.find(
        (p) => p.id.toString() === distProduct?._id.toString(),
      );
      if (_product) {
        const inventoryProduct = {
          name: product.name,
          quantity: parseFloat(_product.quantity),
          unitPrice: distProduct.price,
          totalPrice: distProduct.price * parseFloat(_product.quantity),
          id: product.id,
        };

        iProducts.push(inventoryProduct);
        iTotalPrice += inventoryProduct.totalPrice;
        iDescription =
          iDescription +
          `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
      }
    }

    const inventory = await Inventory.create({
      activeDay,
      products: iProducts,
      totalPrice: iTotalPrice,
      stock: stock._id,
      description: iDescription,
    });
    if (inventory) {
      if (sales) {
        sales.inventory = inventory.id;
        await sales.save({validateBeforeSave: false});
      }

      // update inventory products availability
      let producer = null;
      let total = 0;

      for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        const distProduct = distributorProducts.find(
          (p) => p._id.toString() === reqProduct.id.toString(),
        );
        const _product = stockProducts.find(
          (p) =>
            p.productName.toString() === distProduct.productName.toString(),
        );
        let product = null;
        if (_product) {
          product = await InventoryProduct.findById(_product._id);
          if (product) {
            product.totalAvailable =
              parseFloat(product.totalAvailable) +
              parseFloat(reqProduct.quantity);
            product.dailyAdded =
              parseFloat(product.dailyAdded) + parseFloat(reqProduct.quantity);
            await product.save({validateBeforeSave: false});

            // update empty to be checked

            // stock
            const eCrate = await EmptyCrates.findOne({product: product._id});
            if (eCrate) {
              eCrate.number -= parseFloat(reqProduct.quantity);
              await eCrate.save({validateBeforeSave: false});
            }

            // distributor
            const _eCrate = await EmptyCrates.findOne({
              product: distProduct._id,
            });
            if (_eCrate) {
              _eCrate.number += parseFloat(reqProduct.quantity);
              await _eCrate.save({validateBeforeSave: false});
            }
          }
        }

        // === update dist products ===
        // distProduct.totalAvailable = parseFloat(distProduct.totalAvailable) - parseFloat(reqProduct.quantity);
        // await distProduct.save({validateBeforeSave: false});

        // === find producer ===
        if (!producer) {
          if (product?.product) {
            const p = await Product.findById(product.product);
            if (p) {
              producer = await Producer.findById(p.producer);
            }
          }
        }
        if (producer) {
          if (product?.product) {
            const p = await Product.findById(product.product);
            if (p.producer.toString() === producer.id.toString()) {
              total += parseFloat(
                distProduct.price * parseFloat(reqProduct.quantity),
              );
            }
          }
        }
      }

      // Update stock purchases
      if (producer) {
        let stocks = producer.stocks;
        let stockIndex = stocks.findIndex(
          (s) => s.id.toString() === stock._id.toString(),
        );

        if (stockIndex !== -1) {
          stocks[stockIndex].totalPurchases += parseFloat(total);
        } else {
          stocks.push({id: stock._id, totalPurchases: parseFloat(total)});
        }
        producer.stocks = stocks;
        await producer.save({validateBeforeSave: false});
      }

      // update distributor stocks
      const distributor = await DistributionPoint.findById(
        order.distributionPoint,
      );
      if (distributor) {
        let stocks = distributor.stocks;
        let stockIndex = stocks.findIndex(
          (s) => s.id.toString() === stock._id.toString(),
        );

        if (stockIndex !== -1) {
          stocks[stockIndex].totalPurchases += parseFloat(order.totalPrice);
        } else {
          stocks.push({
            id: stock._id,
            totalPurchases: parseFloat(order.totalPrice),
          });
        }
        distributor.stocks = stocks;
        await distributor.save({validateBeforeSave: false});
      }
    }
  }

  order.status = "invented";
  await order.save({validateBeforeSave: false});

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Order Was Added To Inventory Successfully.",
  });
});

const newDistributorOrder = catchAsync(async (req, res) => {
  const {
    distributorId,
    producerId,
    products: reqProducts,
    activeDay,
  } = req.body;
  const distributionPoint =
    await DistributionPoint.findById(distributorId).populate("manager");
  if (!distributionPoint) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  const producer = await Producer.findById(producerId).populate("manager");
  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  let products = [];
  let totalPrice = 0;
  let description = ``;

  for (let i = 0; i < reqProducts.length; i++) {
    let reqProduct = reqProducts[i];
    let product = await Product.findById(reqProduct.id);

    const salesProduct = {
      id: product.id,
      name: product.name,
      quantity: reqProduct.quantity,
      unitPrice: product.price,
      totalPrice: product.price * parseFloat(reqProduct.quantity),
    };

    products.push(salesProduct);
    totalPrice += salesProduct.totalPrice;
    description =
      description +
      `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;
  }

  const order = await Order.create({
    totalPrice,
    products,
    description,
    distributionPoint: distributionPoint.id,
    producer: producer.id,
    isMine: true,
    customerName: distributionPoint.manager.name,
    phone: distributionPoint.manager.phone,
    activeDay,
  });

  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Something Went Wrong, Plz Try Again.",
    });
  }

  // send notification to admin
  if (producer.manager) {
    const title = "New Order";
    const body = `\n\n\nHello ${producer.manager.fullName} 👋\nYou have new order from ${distributionPoint.name}`;
    sendPushNotification(producer.manager.fcmToken, title, body);
  }

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Order Sent Successfully.",
  });
});

const editDistributorOrder = catchAsync(async (req, res) => {
  const {distributorId, producerId, products: reqProducts, id} = req.body;
  const distributionPoint =
    await DistributionPoint.findById(distributorId).populate("manager");
  if (!distributionPoint) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  const producer = await Producer.findById(producerId).populate("manager");
  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Order Not Found.",
    });
  }

  let products = [];
  let totalPrice = 0;
  let description = ``;

  for (let i = 0; i < reqProducts.length; i++) {
    let reqProduct = reqProducts[i];
    let product = await Product.findById(reqProduct.id);

    const salesProduct = {
      id: product.id,
      name: product.name,
      quantity: reqProduct.quantity,
      unitPrice: product.price,
      totalPrice: product.price * parseFloat(reqProduct.quantity),
    };

    products.push(salesProduct);
    totalPrice += salesProduct.totalPrice;
    description =
      description +
      `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;
  }

  order.products = products;
  order.producer = producer.id;
  order.description = description;
  order.totalPrice = totalPrice;
  await order.save({validateBeforeSave: false});

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Order Edited Successfully.",
  });
});

const getProducerOrders = catchAsync(async (req, res) => {
  const {producerId, isCompleted} = req.query;
  const producer = await Producer.findById(producerId);
  if (!producer) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  let orders = await Order.find({
    producer: producer.id,
    isCompleted: isCompleted,
  });
  orders = await Promise.all(
    orders.map(async (order) => {
      const distributor = await DistributionPoint.findById(
        order.distributionPoint,
      ).populate("manager");
      return {
        id: order.id,
        description: order.description,
        name: distributor.name,
        phone: distributor.manager.phone,
        totalPrice: order.totalPrice,
        products: order.products,
        distributorId: distributor.id,
      };
    }),
  );

  return res.status(httpStatus.OK).json({
    success: true,
    orders,
  });
});

const getDistributorOrders = catchAsync(async (req, res) => {
  const {isCompleted, isMine, distributorId, status} = req.query;

  const distributionPoint = await DistributionPoint.findById(distributorId);
  if (!distributionPoint) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  let orders = [];
  if (isMine) {
    let queryObj = {
      distributionPoint: distributionPoint.id,
      isCompleted,
      status,
      producer: {$ne: null},
    };
    orders = await Order.find(queryObj);
    orders = await Promise.all(
      orders.map(async (order) => {
        const producer = await Producer.findById(order.producer).populate(
          "manager",
        );
        return {
          id: order.id,
          description: order.description,
          name: producer.name,
          phone: producer.manager.phone,
          totalPrice: order.totalPrice,
          products: order.products,
          producerId: producer?.id,
        };
      }),
    );
  } else {
    let queryObj = {
      distributionPoint: distributionPoint.id,
      isCompleted,
      producer: null,
    };
    orders = await Order.find(queryObj);
    orders = await Promise.all(
      orders.map(async (order) => {
        const stock = await Stock.findById(order.stock).populate("admin");
        return {
          id: order.id,
          description: order.description,
          name: stock.name,
          phone: stock.admin.phone,
          totalPrice: order.totalPrice,
          products: order.products,
          stockId: stock?.id,
        };
      }),
    );
  }

  return res.status(httpStatus.OK).json({
    success: true,
    orders,
  });
});

// ========== stock =========
const newStockOrder = catchAsync(async (req, res) => {
  const {distributorId, stockId, products: reqProducts} = req.body;
  const stock = await Stock.findById(stockId).populate("admin");
  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  const distributionPoint =
    await DistributionPoint.findById(distributorId).populate("manager");
  if (!distributionPoint) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  let products = [];
  let totalPrice = 0;
  let description = ``;

  for (let i = 0; i < reqProducts.length; i++) {
    let reqProduct = reqProducts[i];
    let product = await InventoryProduct.findById(reqProduct.id);
    let saleProduct = await SalesProduct.findOne({
      inventoryProduct: product.id,
    });

    const salesProduct = {
      id: product.id,
      name: product.name,
      quantity: reqProduct.quantity,
      unitPrice: saleProduct.price,
      totalPrice: saleProduct.price * parseFloat(reqProduct.quantity),
    };

    products.push(salesProduct);
    totalPrice += salesProduct.totalPrice;
    description =
      description +
      `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;
  }

  const order = await Order.create({
    totalPrice,
    products,
    description,
    distributionPoint: distributionPoint.id,
    stock: stock.id,
    isMine: true,
    customerName: stock.admin.fullName,
    phone: stock.admin.phone,
  });

  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Something Went Wrong, Plz Try Again.",
    });
  }

  // send notification to admin
  if (distributionPoint.manager) {
    const title = "New Order";
    const body = `\n\n\nHello ${distributionPoint.manager.fullName} 👋\n\nYou have new order from ${stock.name}`;
    sendPushNotification(distributionPoint.manager.fcmToken, title, body);
  }

  let stocks = distributionPoint.stocks;
  let stockIndex = stocks.findIndex(
    (s) => s.id.toString() === stock._id.toString(),
  );

  if (stockIndex === -1) {
    stocks.push({
      id: stock._id,
      totalPurchases: parseFloat(order.totalPrice),
    });
  }
  distributionPoint.stocks = stocks;
  await distributionPoint.save({validateBeforeSave: false});

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Order Sent Successfully.",
  });
});

const editStockOrder = catchAsync(async (req, res) => {
  const {distributorId, stockId, products: reqProducts, id} = req.body;
  const stock = await Stock.findById(stockId).populate("admin");
  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  const distributionPoint =
    await DistributionPoint.findById(distributorId).populate("manager");
  if (!distributionPoint) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Distributor Not Found.",
    });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Order Not Found.",
    });
  }

  let products = [];
  let totalPrice = 0;
  let description = ``;

  for (let i = 0; i < reqProducts.length; i++) {
    let reqProduct = reqProducts[i];
    let product = await InventoryProduct.findById(reqProduct.id);
    const saleProduct = await SalesProduct.findOne({
      inventoryProduct: product.id,
    });

    const salesProduct = {
      id: product.id,
      name: product.name,
      quantity: reqProduct.quantity,
      unitPrice: saleProduct.price,
      totalPrice: saleProduct.price * parseFloat(reqProduct.quantity),
    };

    products.push(salesProduct);
    totalPrice += salesProduct.totalPrice;
    description =
      description +
      `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;
  }

  order.products = products;
  order.distributionPoint = distributionPoint.id;
  order.description = description;
  order.totalPrice = totalPrice;
  order.customerName = stock.admin.fullName;
  order.phone = stock.admin.phone;
  await order.save({validateBeforeSave: false});

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Order Edited Successfully.",
  });
});

const getStockOrders = catchAsync(async (req, res) => {
  const {isCompleted, stockId, status} = req.query;

  const stock = await Stock.findById(stockId);
  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  let orders = [];
  let queryObj = {
    stock: stock._id,
    isCompleted,
    status,
    distributionPoint: {$ne: null},
  };
  orders = await Order.find(queryObj);
  orders = await Promise.all(
    orders.map(async (order) => {
      const distributor = await DistributionPoint.findById(
        order.distributionPoint,
      ).populate("manager");
      return {
        id: order.id,
        description: order.description,
        name: distributor?.name,
        phone: distributor?.manager.phone.countryCode + ' ' + distributor?.manager.phone.number,
        totalPrice: order.totalPrice,
        products: order.products,
        distributorId: distributor?.id,
      };
    }),
  );

  return res.status(httpStatus.OK).json({
    success: true,
    orders,
  });
});

// ==== user ===

const newOrder = catchAsync(async (req, res) => {
  const stockId = req.query.stockId;
  const stock = await checkStock(stockId);

  if (!stock) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Stock Not Found.",
    });
  }

  const {products: reqProducts} = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "User Not Found.",
    });
  }

  let products = [];
  let totalPrice = 0;
  let description = ``;

  for (let i = 0; i < reqProducts.length; i++) {
    let reqProduct = reqProducts[i];
    let product = await SalesProduct.findById(reqProduct.id).populate(
      "inventoryProduct",
    );

    const salesProduct = {
      id: product.id,
      name: product.inventoryProduct.name,
      quantity: reqProduct.quantity,
      unitPrice: product.price,
      totalPrice: product.price * reqProduct.quantity,
    };

    products.push(salesProduct);
    totalPrice += salesProduct.totalPrice;
    description =
      description +
      `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;
  }

  const order = await Order.create({
    totalPrice,
    products,
    description,
    customer: user.id,
    stock: stock.id,
    customerName: user.fullName,
    phone: user.phone.countryCode + ' ' + user.phone.number,
  });

  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Something Went Wrong, Plz Try Again.",
    });
  }

  // send notification to admin
  const adminUser = await User.findById(stock.admin);
  if (adminUser) {
    const title = "New Order";
    const body = `\n\n\nHello ${adminUser.fullName} 👋\nYou have new order from ${user.fullName}`;
    sendPushNotification(adminUser.fcmToken, title, body);
  }

  // add user to stock customers
  let customers = stock.customers;
  let customerIndex = customers.findIndex(
    (c) => c.id.toString() === user.id.toString(),
  );

  if (customerIndex === -1) {
    customers.push({id: user.id, totalPurchases: 1, totalPurchaseAmount: parseFloat(order.totalPrice)});
  } else {
    customers[customerIndex].totalPurchases += 1;
    customers[customerIndex].totalPurchaseAmount += parseFloat(order.totalPrice);
  }
  
  stock.customers = customers;
  await stock.save({validateBeforeSave: false});

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: "Order Sent Successfully.",
  });
});

const editOrder = catchAsync(async (req, res) => {
  const {products: reqProducts} = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "User Not Found.",
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Order Not Found.",
    });
  }

  let products = [];
  let totalPrice = 0;
  let description = ``;

  for (let i = 0; i < reqProducts.length; i++) {
    let reqProduct = reqProducts[i];
    let product = await SalesProduct.findById(reqProduct.id).populate(
      "inventoryProduct",
    );

    const salesProduct = {
      id: product.id,
      name: product.inventoryProduct.name,
      quantity: reqProduct.quantity,
      unitPrice: product.price,
      totalPrice: product.price * reqProduct.quantity,
    };

    products.push(salesProduct);
    totalPrice += salesProduct.totalPrice;
    description =
      description +
      `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} \n`;
  }

  order.products = products;
  order.totalPrice = totalPrice;
  order.description = description;

  await order.save({validateBeforeSave: false});

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Order Was Edited Successfully.",
  });
});

const myOrders = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "User Not Found.",
    });
  }
  const query = {
    customer: user.id,
    ...(req.query.status && {status: req.query.status}),
  };
  const orders = await Order.find(query).populate("stock");

  return res.status(httpStatus.OK).json({
    success: true,
    orders,
  });
});

const adminOrders = catchAsync(async (req, res) => {
  let orders = await Order.find(
    {
      isCompleted: req.query.isCompleted,
      stock: req.query.stockId,
      distributionPoint: null,
    },
    {products: 0},
  ).populate("customer");
  orders = orders.map((o) => {
    return {
      name: o.customer?.fullName,
      description: o.description,
      id: o.id,
      isCompleted: o.isCompleted,
      isFullyPaid: o.isFullyPaid,
      totalPrice: o.totalPrice,
      phone: o.phone,
    };
  });
  return res.status(httpStatus.OK).json({
    success: true,
    orders,
  });
});

module.exports = {
  completeOrder,
  inventOrder,

  newDistributorOrder,
  editDistributorOrder,
  getProducerOrders,
  getDistributorOrders,

  newStockOrder,
  editStockOrder,
  getStockOrders,

  newOrder,
  editOrder,
  myOrders,
  adminOrders,
};
