const httpStatus = require('http-status');

const {
    InventoryProduct,
    SalesProduct,
    Sales,
    Credit,
    PaymentMethod,
    Payment,
    User,
    Order,
    Product,
    Producer,
    DistributionPoint,
    ActiveDay,
    Inventory,
    Stock,
    EmptyCrates
} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {checkDay} = require('./activeDay.controller');
const formatNumber = require('../utils/formatNumber');


async function updateProducerInventory(initials, distributor) {
    for (const iProduct of initials) {
        const inP = await InventoryProduct.findOne({distributionPoint: distributor?._id, product: iProduct.id});
        if (inP) {
            // distributor
            inP.totalAvailable -= parseFloat(iProduct.quantity);
            await inP.save({validateBeforeSave: false});

            // producer
            const product = await Product.findById(inP.product);
            if (product) {
                product.totalAvailable += parseFloat(iProduct.quantity);
                await product.save({validateBeforeSave: false});
            }

            // update empty

            // producer
            const eCrate = await EmptyCrates.findOne({product: product._id});
            if (eCrate) {
                eCrate.number -= parseFloat(iProduct.quantity);
                await eCrate.save({validateBeforeSave: false});
            }

            // distributor
            const _eCrate = await EmptyCrates.findOne({product: inP._id});
            if (_eCrate) {
                _eCrate.number += parseFloat(iProduct.quantity);
                await _eCrate.save({validateBeforeSave: false});
            }
        }
    }
}

async function updateDistributorInventory(initials, stock, distributionPoint) {
    for (const iProduct of initials) {
        const inP = await InventoryProduct.findOne({stock: stock?._id, productName: iProduct.productName});
        if (inP) {
            // stock
            inP.totalAvailable -= parseFloat(iProduct.quantity);
            await inP.save({validateBeforeSave: false});

            // distributor
            const product = await InventoryProduct.findOne({distributionPoint, productName: iProduct.productName});
            if (product) {
                product.totalAvailable += parseFloat(iProduct.quantity);
                await product.save({validateBeforeSave: false});
            }

            // update empty

            // distributor
            const eCrate = await EmptyCrates.findOne({product: product._id});
            if (eCrate) {
                eCrate.number -= parseFloat(iProduct.quantity);
                await eCrate.save({validateBeforeSave: false});
            }

            // stock
            const _eCrate = await EmptyCrates.findOne({product: inP._id});
            if (_eCrate) {
                _eCrate.number += parseFloat(iProduct.quantity);
                await _eCrate.save({validateBeforeSave: false});
            }
        }
    }
}

async function updateInventory(initials) {
    for (const iProduct of initials) {
        const sIProduct = await SalesProduct.findById(iProduct.id);
        const inP = await InventoryProduct.findById(sIProduct.inventoryProduct);

        inP.totalAvailable += parseFloat(iProduct.quantity);
        await inP.save({validateBeforeSave: false});

        // update empty
        const eCrate = await EmptyCrates.findOne({product: inP._id});
        if (eCrate) {
            eCrate.number -= parseFloat(iProduct.quantity);
            await eCrate.save({validateBeforeSave: false});
        }
    }
}

async function processProducts(reqProducts, entityType) {
    const products = [];
    let totalPrice = 0;
    let description = '';

    for (const reqProduct of reqProducts) {
        const product = entityType === 'producer' ?
            await Product.findById(reqProduct.id) : entityType === 'distributionPoint' ?
                await InventoryProduct.findById(reqProduct.id) :
                await SalesProduct.findById(reqProduct.id).populate('inventoryProduct');

        const salesProduct = entityType === 'producer' ? {

            name: product.name,
            quantity: reqProduct.quantity,
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity,
            product: product.id,

        } : entityType === 'distributionPoint' ? {

            name: product.name,
            quantity: reqProduct.quantity,
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity,
            salesProduct: product.id,
            inventoryProduct: reqProduct.id

        } : {

            name: product.inventoryProduct.name,
            quantity: reqProduct.quantity,
            unitPrice: product.price,
            totalPrice: product.price * reqProduct.quantity,
            salesProduct: product.id,

        };

        products.push(salesProduct);
        totalPrice += salesProduct.totalPrice;
        description += `${salesProduct.name}: ${formatNumber(salesProduct.quantity)} x ${formatNumber(salesProduct.unitPrice)} = ${formatNumber(salesProduct.totalPrice)} Rwf\n`;
    }

    return {products, totalPrice, description};
}

async function processPayments(payments) {
    let paymentDescription = '';
    let _payments = [];

    if (payments.length > 0) {
        for (let payment of payments) {
            let method = await PaymentMethod.findById(payment.id);
            const _payment = {
                id: method.id,
                name: method.name,
                amount: payment.amount
            };
            _payments.push(_payment);
            paymentDescription = paymentDescription + `${_payment.name}: ${formatNumber(_payment.amount)} Rwf \n`;
        }
    } else {
        paymentDescription = 'No Payments Yet.';
    }

    return {paymentDescription, _payments};
}

function validateTotalPayments(payments, amount) {
    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return parseFloat(total) === parseFloat(amount);
}

async function updateInventoryProducts(distributorId, reqProducts, inventoryId, producer, iPurchase) {
    const distributionProducts = await InventoryProduct.find({distributionPoint: distributorId});
    const iProducts = [];
    let iTotalPrice = 0;
    let iDescription = '';

    for (const product of distributionProducts) {
        const reqProduct = reqProducts.find(p => p.productName === product.productName);
        if (reqProduct) {
            const inventoryProduct = {
                name: product.name,
                quantity: parseFloat(reqProduct.quantity),
                unitPrice: product.price,
                totalPrice: product.price * parseFloat(reqProduct.quantity),
                id: product.id
            };

            iProducts.push(inventoryProduct);
            iTotalPrice += inventoryProduct.totalPrice;
            iDescription += `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
        }
    }

    const inventory = await Inventory.findById(inventoryId);
    if (inventory) {
        inventory.products = iProducts;
        inventory.totalPrice = iTotalPrice;
        inventory.description = iDescription;
        await inventory.save({validateBeforeSave: false});
    }
    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findOne({distributionPoint: distributorId, productName: reqProduct.productName});

        // distributor
        product.totalAvailable += parseFloat(reqProduct.quantity);
        await product.save({validateBeforeSave: false});

        // producer
        const _product = await Product.findById(inP.product);
        if (_product) {
            _product.totalAvailable -= parseFloat(reqProduct.quantity);
            await product.save({validateBeforeSave: false});
        }

        // update empty

        // distributor
        const eCrate = await EmptyCrates.findOne({product: product._id});
        if (eCrate) {
            eCrate.number -= parseFloat(reqProduct.quantity);
            await eCrate.save({validateBeforeSave: false});
        }

        // producer
        const _eCrate = await EmptyCrates.findOne({product: _product._id});
        if (_eCrate) {
            _eCrate.number += parseFloat(reqProduct.quantity);
            await _eCrate.save({validateBeforeSave: false});
        }
    }

    // Update distributor purchases
    let distributors = producer.distributionPoints;
    let distributorIndex = distributors.findIndex(d => d.id.toString() === distributorId.toString());

    if (distributorIndex !== -1) {
        distributors[distributorIndex].totalPurchases -= parseFloat(iPurchase);
        distributors[distributorIndex].totalPurchases += parseFloat(iTotalPrice);
        producer.distributionPoints = distributors;
        await producer.save({validateBeforeSave: false});
    }
}

async function updateStockProducts(stockId, reqProducts, inventoryId, iPurchase) {
    const stockProduct = await InventoryProduct.find({stock: stockId});
    const iProducts = [];
    let iTotalPrice = 0;
    let iDescription = '';

    for (const product of stockProduct) {
        const reqProduct = reqProducts.find(p => p.productName === product.productName);

        if (reqProduct) {
            const saleProduct = await SalesProduct.findOne({inventoryProduct: reqProduct.id});
            const inventoryProduct = {
                name: product.name,
                quantity: parseFloat(reqProduct.quantity),
                unitPrice: saleProduct.price,
                totalPrice: saleProduct.price * parseFloat(reqProduct.quantity),
                id: product.id
            };

            iProducts.push(inventoryProduct);
            iTotalPrice += inventoryProduct.totalPrice;
            iDescription += `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
        }
    }

    const inventory = await Inventory.findById(inventoryId);
    if (inventory) {
        inventory.products = iProducts;
        inventory.totalPrice = iTotalPrice;
        inventory.description = iDescription;
        await inventory.save({validateBeforeSave: false});
    }
    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];

        // stock
        let product = await InventoryProduct.findOne({stock: stockId, productName: reqProduct.productName});
        product.totalAvailable += parseFloat(reqProduct.quantity);
        await product.save({validateBeforeSave: false});


        // distributor
        const _product = await InventoryProduct.findById(reqProduct.id);
        if (_product) {
            _product.totalAvailable -= parseFloat(reqProduct.quantity);
            await _product.save({validateBeforeSave: false});
        }

        // update empty

        // stock
        const eCrate = await EmptyCrates.findOne({product: product._id});
        if (eCrate) {
            eCrate.number -= parseFloat(reqProduct.quantity);
            await eCrate.save({validateBeforeSave: false});
        }

        // distributor
        const _eCrate = await EmptyCrates.findOne({product: _product._id});
        if (_eCrate) {
            _eCrate.number += parseFloat(reqProduct.quantity);
            await _eCrate.save({validateBeforeSave: false});
        }
    }

    let producer = null;
    let total = 0;

    // update inventory products availability
    for (let i = 0; i < reqProducts.length; i++) {
        let reqProduct = reqProducts[i];
        let product = await InventoryProduct.findOne({stock: stockId, productName: reqProduct.productName});

        if (!producer) {
            if (product.product) {
                const p = await Product.findById(product.product);
                if (p) {
                    producer = await Producer.findById(p.producer);
                }
            }
        }

        // 
        if (producer) {
            if (product.product) {
                const p = await Product.findById(product.product);
                if (p) {
                    const saleProduct = await SalesProduct.findOne({inventoryProduct: product.id});
                    if (saleProduct) {
                        total += parseFloat(saleProduct.price) * parseFloat(reqProduct.quantity);
                    }
                }
            }
        }
    }

    // Update stock purchases
    if (producer) {
        let stocks = producer.stocks;
        let stockIndex = stocks.findIndex(d => d.id.toString() === stockId.toString());

        if (stockIndex !== -1) {
            stocks[stockIndex].totalPurchases -= parseFloat(iPurchase);
            stocks[stockIndex].totalPurchases += parseFloat(total);
            producer.stocks = stocks;
            await producer.save({validateBeforeSave: false});
        }
    }
}

async function updateInventoryProductsForNonProducers(reqProducts, iPurchase, customerId) {

    let producer = null;
    let total = 0;

    for (const reqProduct of reqProducts) {
        const product = await SalesProduct.findById(reqProduct.id);
        const inventoryProduct = await InventoryProduct.findById(product.inventoryProduct);

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
        const eCrate = await EmptyCrates.findOne({product: inventoryProduct._id});
        if (eCrate) {
            eCrate.number += parseFloat(reqProduct.quantity);
            await eCrate.save({validateBeforeSave: false});
        }

    }

    if (producer) {
        let customers = producer.customers;
        let stockIndex = customers.findIndex(d => d.id.toString() === customerId.toString());

        if (stockIndex !== -1) {
            customers[stockIndex].totalPurchases -= parseFloat(iPurchase);
            customers[stockIndex].totalPurchases += parseFloat(total);
            producer.customers = customers;
            await producer.save({validateBeforeSave: false});
        }
    }
}

async function handleCredit(sale, totalPrice, amountPaid, description, customerName, customerPhone, entityType, entityId) {
    let credit = await Credit.findOne({sales: sale.id});
    if (credit) {
        credit.totalAmount = totalPrice - amountPaid;
        credit.description = description;
        credit.customerName = customerName;
        credit.customerPhone = customerPhone;
        await credit.save({validateBeforeSave: false});
    } else {
        credit = await Credit.create({activeDay: sale.activeDay, [entityType]: entityId, sales: sale.id, totalAmount: totalPrice - amountPaid, description, customerName, customerPhone});
        if (!credit) {
            return res.status(httpStatus.OK).json({success: true, message: 'Sales recorded successfully, but credit failed to be recorded.'});
        }
    }
}

async function deletePayments(saleId) {
    const prevPayments = await Payment.find({sale: saleId});
    for (const p of prevPayments) {
        await p.deleteOne();
    }
}

async function createPayments(payments, sale, entityType, entityId, user, customerName, customerPhone) {
    if (payments.length > 0) {
        for (const payment of payments) {
            const method = await PaymentMethod.findById(payment.id);
            await Payment.create({sale: sale.id, activeDay: sale.activeDay, method: method.id, amount: payment.amount, [entityType]: entityId, customer: user && user.id, customerName, customerPhone});
        }
    }
}


async function getEntityById(entityType, entityId) {
    if (entityType === 'stock') return await Stock.findById(entityId);
    if (entityType === 'distributionPoint') return await DistributionPoint.findById(entityId);
    if (entityType === 'producer') return await Producer.findById(entityId);
    return null;
}

async function getCustomerDetails(customerId, body) {
    const user = await User.findById(customerId);
    const distributor = await DistributionPoint.findById(customerId).populate('manager');
    const stock = await Stock.findById(customerId).populate('admin');
    const customer = (user ? user.id : distributor ? distributor.id : stock ? stock.id : null);
    return {
        customerName: user ? user.fullName : distributor ? distributor.name : stock ? stock.name : body.customerName,
        customerPhone: user ? user.phone : distributor ? distributor.manager?.phone : stock ? stock.admin?.phone : body.customerPhone,
        user,
        distributor,
        customer,
        stock
    };
}

const newSales = catchAsync(async (req, res) => {

    const {products: reqProducts, isFullyPaid, amountPaid, payments, customerId, entityId, entityType} = req.body;

    // if (!customerId) {
    //     return res.status(httpStatus.NOT_FOUND).json({
    //         success: false,
    //         message: 'Plz Select Customer.'
    //     });
    // }

    let entity = await getEntityById(entityType, entityId);

    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    const activeDay = await checkDay({entityId, entityType});

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }

    let {customerName, customerPhone, user, distributor, customer, stock} = await getCustomerDetails(customerId, req.body);

    if (!isFullyPaid && !amountPaid) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Add How Much User Paid.'
        });
    }

    if (isFullyPaid && payments.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Plz Add How User Paid.'
        });
    }

    if (amountPaid > 0) {
        if (payments.length === 0) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Plz Add How User Paid.'
            });
        } else if (!validateTotalPayments(payments, amountPaid)) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
            });
        }
    }

    const {products, description, totalPrice} = await processProducts(reqProducts, entityType);
    const {_payments, paymentDescription} = await processPayments(payments);

    // handle amount
    let amount = isFullyPaid ? totalPrice : amountPaid;

    if (isFullyPaid && !validateTotalPayments(payments, amount)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Amount From All Methods Has To Be Equal To Total Amount Paid.'
        });
    }

    let saleObject = {[entityType]: entityId, activeDay: activeDay.id, products, totalPrice, isFullyPaid, amountPaid: amount, description, paymentDescription, payments: _payments, customer, customerName, customerPhone};
    if (entityType === 'producer') {
        saleObject.distributionPoint = distributor?.id;
    } else if (entityType === 'distributionPoint') {
        saleObject.stock = stock?.id;
    } else {
        saleObject.customer = user?.id;
    }

    const sales = await Sales.create(saleObject);
    if (!sales) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Something Went Wrong, Plz Try Again.'
        });
    }

    if (entityType === 'distributionPoint') {
        const stockProducts = await InventoryProduct.find({stock: stock.id});
        for (let product of reqProducts) {
            const _product = stockProducts.find(p => p.productName === product.productName);
            if (!_product) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: `${customerName} Must Register ${product.name}`
                });
            }
        }
    }

    // if not fully paid, create new credit
    if (!isFullyPaid) {
        let obj = {activeDay: activeDay.id, [entityType]: entityId, sales: sales.id, totalAmount: totalPrice - amountPaid, description, customer, customerName, customerPhone};
        if (entityType === 'producer') {
            obj.distributionPoint = distributor.id;
            obj.isOwed = true;
        }
        const credit = await Credit.create(obj);
        if (!credit) {
            return res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Sales Eecorded Successfully But, Credit Failed To Te Recorder.',
            });
        }
    }

    if (payments.length > 0) {
        for (const payment of payments) {
            let method = await PaymentMethod.findById(payment.id);
            await Payment.create({activeDay: activeDay.id, method: method.id, amount: payment.amount, [entityType]: entityId, customer, customerName, customerPhone, sale: sales.id});
        }
    }

    // handle inventories
    let iProducts = [];
    let iTotalPrice = 0;
    let iDescription = ``;

    if (entityType === 'producer') {
        const distributionProducts = await InventoryProduct.find({distributionPoint: distributor._id});
        let activeDay = await ActiveDay.findOne({isActive: true, distributionPoint: distributor._id});
        if (!activeDay) {
            const days = await ActiveDay.find({distributionPoint: distributor.id});
            activeDay = days[days.length - 1];
        }
        for (let product of distributionProducts) {
            const _product = reqProducts.find(p => p.productName === product.productName);
            if (_product) {
                const inventoryProduct = {
                    name: product.name,
                    quantity: parseFloat(_product.quantity),
                    unitPrice: product.price,
                    totalPrice: product.price * parseFloat(_product.quantity),
                    id: product._id
                };

                iProducts.push(inventoryProduct);
                iTotalPrice += inventoryProduct.totalPrice;
                iDescription = iDescription + `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
            }
        }

        const inventory = await Inventory.create({activeDay: activeDay.id, products: iProducts, totalPrice: iTotalPrice, distributionPoint: distributor._id, description: iDescription});
        if (inventory) {
            // update inventory products availability
            for (let i = 0; i < reqProducts.length; i++) {
                let reqProduct = reqProducts[i];

                // distributor
                let product = await InventoryProduct.findOne({distributionPoint: distributor._id, productName: reqProduct.productName});
                product.totalAvailable += parseFloat(reqProduct.quantity);
                product.dailyAdded += parseFloat(reqProduct.quantity);
                await product.save({validateBeforeSave: false});

                // producer
                let _product = await Product.findById(reqProduct.id);
                _product.totalAvailable -= parseFloat(reqProduct.quantity);
                await _product.save({validateBeforeSave: false});

                // update empty crates

                // producer
                const emptyCrate = await EmptyCrates.findOne({product: _product?.id});
                if (emptyCrate) {
                    emptyCrate.number += parseFloat(reqProduct.quantity);
                    await emptyCrate.save({validateBeforeSave: false});
                }

                // distributor
                const eCrate = await EmptyCrates.findOne({product: product._id});
                if (eCrate) {
                    eCrate.number -= parseFloat(reqProduct.quantity);
                    await eCrate.save({validateBeforeSave: false});
                }

            }

            // Update distributor purchases
            let distributors = entity.distributionPoints;
            let distributorIndex = distributors.findIndex(d => d.id.toString() === distributor._id.toString());

            if (distributorIndex !== -1) {
                distributors[distributorIndex].totalPurchases += parseFloat(totalPrice);
            } else {
                distributors.push({id: distributor._id, totalPurchases: parseFloat(total)});
            }
            await entity.save({validateBeforeSave: false});
            entity.distributionPoints = distributors;

            sales.inventory = inventory.id;
            sales.purchase = parseFloat(totalPrice);
            await sales.save({validateBeforeSave: false});
        }
    } else if (entityType === 'distributionPoint') {
        const stockProducts = await InventoryProduct.find({stock: stock.id});
        let activeDay = await ActiveDay.findOne({isActive: true, stock: stock._id});
        if (!activeDay) {
            const days = await ActiveDay.find({stock: distributor.id});
            activeDay = days[days.length - 1];
        }
        for (let product of stockProducts) {
            const _product = reqProducts.find(p => p.productName === product.productName);
            if (_product) {
                const saleProduct = await SalesProduct.findOne({inventoryProduct: _product.id});
                const inventoryProduct = {
                    name: product.name,
                    quantity: parseFloat(_product.quantity),
                    unitPrice: saleProduct.price,
                    totalPrice: saleProduct.price * parseFloat(_product.quantity),
                    id: product._id
                };

                iProducts.push(inventoryProduct);
                iTotalPrice += inventoryProduct.totalPrice;
                iDescription = iDescription + `${inventoryProduct.name}: ${formatNumber(inventoryProduct.quantity)} x ${formatNumber(inventoryProduct.unitPrice)} = ${formatNumber(inventoryProduct.totalPrice)} Rwf\n`;
            }
        }

        const inventory = await Inventory.create({activeDay: activeDay.id, products: iProducts, totalPrice: iTotalPrice, stock: stock._id, description: iDescription});
        if (inventory) {
            let producer = null;
            let total = 0;

            // update inventory products availability
            for (let i = 0; i < reqProducts.length; i++) {
                let reqProduct = reqProducts[i];

                // stock
                let product = await InventoryProduct.findOne({stock: stock._id, productName: reqProduct.productName});
                product.totalAvailable += parseFloat(reqProduct.quantity);
                product.dailyAdded += parseFloat(reqProduct.quantity);
                await product.save({validateBeforeSave: false});

                // distributor
                let _product = await InventoryProduct.findById(reqProduct.id);
                _product.totalAvailable -= parseFloat(reqProduct.quantity);
                await _product.save({validateBeforeSave: false});

                // update empty crates

                // distributor
                const eCrate = await EmptyCrates.findOne({product: _product._id});
                if (eCrate) {
                    eCrate.number += parseFloat(reqProduct.quantity);
                    await eCrate.save({validateBeforeSave: false});
                }

                // stock
                const _eCrate = await EmptyCrates.findOne({product: product._id});
                if (_eCrate) {
                    _eCrate.number -= parseFloat(reqProduct.quantity);
                    await _eCrate.save({validateBeforeSave: false});
                }


                if (!producer) {
                    if (product.product) {
                        const p = await Product.findById(product.product);
                        if (p) {
                            producer = await Producer.findById(p.producer);
                        }
                    }
                }

                // 
                if (producer) {
                    if (product.product) {
                        const p = await Product.findById(product.product);
                        if (p) {
                            const saleProduct = await SalesProduct.findOne({inventoryProduct: product.id});
                            if (saleProduct) {
                                total += parseFloat(saleProduct.price) * parseFloat(reqProduct.quantity);
                            }
                        }
                    }
                }
            }

            // Update distributor purchases
            let stocks = entity.stocks;
            let stockIndex = stocks.findIndex(d => d.id.toString() === stock._id.toString());

            if (stockIndex !== -1) {
                stocks[stockIndex].totalPurchases += parseFloat(totalPrice);
                entity.distributionPoints = stocks;
                await entity.save({validateBeforeSave: false});
            }

            if (producer) {
                let stocks = producer.stocks;
                let stockIndex = stocks.findIndex(d => d.id.toString() === stock._id.toString());

                if (stockIndex !== -1) {
                    stocks[stockIndex].totalPurchases += parseFloat(total);
                } else {
                    stocks.push({id: stock._id, totalPurchases: parseFloat(total)});
                }
                producer.distributionPoints = stocks;
                await producer.save({validateBeforeSave: false});
            }

            sales.inventory = inventory.id;
            sales.purchase = parseFloat(total);
            await sales.save({validateBeforeSave: false});
        }
    } else {
        let producer = null;
        let total = 0;

        // update inventory products availability

        for (let i = 0; i < reqProducts.length; i++) {
            let reqProduct = reqProducts[i];
            let salesProduct = await SalesProduct.findById(reqProduct.id);
            let product = await InventoryProduct.findById(salesProduct.inventoryProduct);
            const producerProduct = await Product.findById(product?.product);
            if (!producer) {
                if (producerProduct) {
                    producer = await Producer.findById(producerProduct.producer);
                }
            }
            if (producer) {
                total += parseFloat(salesProduct.price) * parseFloat(reqProduct.quantity);
            }

            product.totalAvailable -= parseFloat(reqProduct.quantity);
            await product.save({validateBeforeSave: false});

            // update empty
            const eCrate = await EmptyCrates.findOne({product: product._id});
            if (eCrate) {
                eCrate.number += parseFloat(reqProduct.quantity);
                await eCrate.save({validateBeforeSave: false});
            }
        }
        if (producer) {
            let customers = producer.customers;
            let stockIndex = customers.findIndex(d => d.id.toString() === customer.toString());

            if (stockIndex !== -1) {
                customers[stockIndex].totalPurchases += parseFloat(total);
            } else {
                customers.push({id: customer, totalPurchases: parseFloat(total)});
            }
            producer.customers = customers;
            await producer.save({validateBeforeSave: false});
        }
        sales.purchase = parseFloat(total);
        await sales.save({validateBeforeSave: false});
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Sales Recorded Successfully.',
    });

});

const editSales = catchAsync(async (req, res) => {
    const {products: reqProducts, isFullyPaid, amountPaid, payments, entityType, entityId} = req.body;

    let entity = await getEntityById(entityType, entityId);
    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity not found.'
        });
    }

    const saleId = req.query.saleId;
    const sale = await Sales.findById(saleId);

    if (!sale) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Sale not found.'
        });
    }

    let {customerName, customerPhone, user, distributor, stock} = await getCustomerDetails(sale.customer, req.body);

    if (!isFullyPaid && !amountPaid) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Please add the amount paid by the user.'
        });
    }

    if (isFullyPaid && payments.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Please add how the user paid.'
        });
    }

    if (amountPaid > 0 && payments.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Please add how the user paid.'
        });
    }

    if (amountPaid > 0) {
        const totalPayments = payments.reduce((total, p) => total + parseFloat(p.amount), 0);
        if (parseFloat(totalPayments) !== parseFloat(amountPaid)) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Total payment methods amount must equal the total amount paid.'
            });
        }
    }

    const initials = [];
    const salesProducts = sale.products;
    if (entityType === 'producer') {
        for (const p of salesProducts) {
            initials.push({id: p.product, quantity: p.quantity});
        }
        await updateProducerInventory(initials, distributor);
    } else if (entityType === 'distributionPoint') {
        for (const p of salesProducts) {
            let name = p.name.replace(/\s/g, '').toLowerCase();
            initials.push({id: p.product, quantity: p.quantity, productName: name});
        }
        await updateDistributorInventory(initials, stock, entityId);
    } else {
        for (const p of salesProducts) {
            initials.push({id: p.salesProduct, quantity: p.quantity});
        }
        await updateInventory(initials);
    }

    if (reqProducts.length === 0) {
        if (sale.fromOrder) {
            const order = await Order.findOne({sale: sale.id});
            if (order) await order.deleteOne();
        }
        await deletePayments(sale.id);
        await sale.deleteOne();
        return res.status(httpStatus.OK).json({success: true, message: 'Sales edited successfully.'});
    }

    const {products, totalPrice, description} = await processProducts(reqProducts, entityType);
    const {paymentDescription, _payments} = await processPayments(payments);

    const amount = isFullyPaid ? totalPrice : amountPaid;
    if (isFullyPaid && !validateTotalPayments(payments, amount)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Total payment methods amount must equal the total amount paid.'
        });
    }

    let purchase = sale.purchase;
    if (!sale.fromOrder) {
        sale.products = products;
        sale.payments = _payments;
        sale.totalPrice = totalPrice;
        sale.paymentDescription = paymentDescription;
        sale.description = description;
        sale.amountPaid = amount;
        sale.isFullyPaid = isFullyPaid;
        sale.fromOrder = false;
        sale.purcahse = totalPrice;
    }

    await sale.save({validateBeforeSave: false});

    if (entityType === 'producer') {
        await updateInventoryProducts(distributor._id, reqProducts, sale.inventory, entity, purchase);
    } else if (entityType === 'distributionPoint') {
        await updateStockProducts(stock._id, reqProducts, sale.inventory, purchase);
    } else {
        await updateInventoryProductsForNonProducers(reqProducts, purchase, sale.customer);
    }

    if (!isFullyPaid) {
        await handleCredit(sale, totalPrice, amountPaid, description, customerName || sale.customerName, customerPhone || sale.customerPhone, entityType, entityId);
    } else {
        let credit = await Credit.findOne({sales: sale.id});
        if (credit) {
            await credit.deleteOne();
        }
    }

    await deletePayments(sale.id);
    await createPayments(payments, sale, entityType, entityId, user, customerName || sale.customerName, customerPhone || sale.customerPhone);

    if (sale.products.length === 0) {
        await sale.deleteOne();
    }

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Sales edited successfully.'
    });
});


const allSales = catchAsync(async (req, res) => {
    const {entityId, entityType} = req.query;

    let entity = await getEntityById(entityType, entityId);
    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }
    let sales = [];
    if (entityType === 'producer') {
        sales = await Sales.find({[entityType]: entityId}, {activeDay: 0});
    } else if (entityType === 'distributionPoint') {
        sales = await Sales.find({[entityType]: entityId, producer: null}, {activeDay: 0});
    } else if (entityType === 'stock') {
        sales = await Sales.find({[entityType]: entityId, producer: null, distributionPoint: null}, {activeDay: 0});
    }

    return res.status(httpStatus.OK).json({
        success: true,
        sales
    });
});


const dailySales = catchAsync(async (req, res) => {
    const {entityId, entityType, dayId} = req.query;

    let entity = await getEntityById(entityType, entityId);

    if (!entity) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: 'Entity Not Found.'
        });
    }

    const activeDay = await checkDay({entityType, entityId});

    if (!activeDay) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'No Active Day, Plz Start New Day And Try Again.'
        });
    }

    const sales = await Sales.find({activeDay: dayId, [entityType]: entityId}, {activeDay: 0});

    return res.status(httpStatus.OK).json({
        success: true,
        sales
    });

});

const salesStats = catchAsync(async (req, res) => {
    const sales = await Sales.find({stock: req.query.stockId}, {activeDay: 0, products: 0});

    let totalSales = 0;
    let totalAmountSold = 0;

    sales.forEach(sale => {
        totalSales++;
        totalAmountSold += sale.totalPrice;
    });

    return res.status(httpStatus.OK).json({
        success: true,
        stats: {
            totalSales,
            totalAmountSold
        }
    });
});


module.exports = {
    newSales,
    editSales,
    allSales,
    dailySales,
    salesStats,

    getEntityById,
    validateTotalPayments,
};
