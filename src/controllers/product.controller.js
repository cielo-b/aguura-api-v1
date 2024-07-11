const httpStatus = require('http-status');

const {Producer, Product, User} = require('../models');
const catchAsync = require('../utils/catchAsync');
const {ebmService} = require('../services');


const newProducts = catchAsync(async (req, res) => {

    const producerId = req.query.producerId;
    const producer = await Producer.findById(producerId);

    if (!producer) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Producer Not Found.'
        });
    }

    const manager = await User.findById(producer.manager);
    const currentProducts = await Product.find({producer: producer.id});

    const {products} = req.body;
    let _products = [];
    let savedProducts = [];

    for (let p of products) {
        if (p.name) {
            const productName = p.name.replace(/\s/g, '').toLowerCase();
            _products.push({productName, name: p.name, producer: producer.id, price: p.price});
        }
    }
    for (let p of _products) {
        const product = await Product.findOne({productName: p.productName, producer: producer.id});
        if (product) {
            continue;
        }
        let newProduct = await Product.create(p);
        if (newProduct) {
            savedProducts.push(newProduct);
        }
    }

    if (manager.country === 'rwanda') {
        for (let i = 0; i < savedProducts.length; i++) {

            const product = savedProducts[i];
            const {itemCd, pkgUnitCd, qtyUnitCd} = ebmService.generateItemCode(producer.type, manager?.countryCode || 'RW', 2, (currentProducts.length + i + 1));
            const data = {
                tin: manager.tin,
                bhfId: manager.bhfId,
                itemCd,
                itemClsCd: '5059690800',
                itemTyCd: '2',
                itemNm: product.name,
                itemStdNm: null,
                orgnNatCd: product.orgnNatCd || 'RW',
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
                regrNm: producer.name,
                regrId: producer.id.slice(0, 20),
                modrNm: manager.fullName,
                modrId: manager.id.slice(0, 20)
            };

            const response = await ebmService.saveItems(data);

            if (response && response.resultCd === '000') {
                product.itemCd = itemCd;
                product.pkgUnitCd = pkgUnitCd;
                product.qtyUnitCd = qtyUnitCd;
                product.itemClsCd = data.itemClsCd;
                product.itemTyCd = data.itemTyCd;
                product.orgnNatCd = data.orgnNatCd;


                await product.save({validateBeforeSave: false});
            } else {
                // delete product if not recorded into ebm servers
                await product.deleteOne();
            }

        }
    }

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: `${products.length > 0 ? 'Products Added Successfully.' : 'Product Added Successfully.'}`
    });

});

const editProduct = catchAsync(async (req, res) => {

    const product = await Product.findById(req.params.productId);

    if (!product) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Not Found.',
        });
    }

    const {name, price} = req.body;
    const productName = name.replace(/\s/g, '').toLowerCase();
    const _product = await Product.findOne({productName, producer: product.producer});

    if (_product && _product.id !== product.id) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Product Already Exists.',
        });
    }

    const pName = name ? name : product.name;
    const pPrice = price ? price : product.price;
    product.name = pName;
    product.price = pPrice;

    await product.save({validateBeforeSave: false});

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Product Edited Successfully.',
    });

});

const allProducts = catchAsync(async (req, res) => {

    const producer = await Producer.findById(req.query.producerId);
    if (!producer) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Producer Not Found.',
        });
    }

    const products = await Product.find({producer: req.query.producerId});

    const manager = await User.findById(producer.manager);

    const response = await ebmService.selectItems({
        tin: manager.tin.toString(),
        bhfId: manager.bhfId,
        lastReqDt: `20130101000000`
    });

    // Create a set of product keys based on itemCd, itemClsCd, and name
    const productKeys = new Set(products.map(product => `${product.itemCd}-${product.itemClsCd}-${product.name}`));

    // Filter ebmItems to only include items that do not have corresponding products
    const ebmItemsWithoutProducts = (response.resultCd === '000' ? response.data?.itemList : []).filter(item => {
        const itemKey = `${item.itemCd}-${item.itemClsCd}-${item.itemNm}`;
        return !productKeys.has(itemKey);
    });

    return res.status(httpStatus.OK).json({
        success: true,
        products,
        ebmItems: ebmItemsWithoutProducts
    });
});


const importEbmProducts = catchAsync(async (req, res) => {
    const {producerId, ebmItems} = req.body;

    const producer = await Producer.findById(producerId);
    if (!producer) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Producer Not Found.',
        });
    }

    for (let item of ebmItems) {
        const productName = item.itemNm.replace(/\s/g, '').toLowerCase();
        const product = await Product.findOne({producer: producer.id, productName});
        if (!product) {
            await Product.create({
                producer: producer.id,
                name: item.itemNm,
                productName,
                price: item.dftPrc,
                itemCd: item.itemCd,
                itemClsCd: item.itemClsCd,
                itemTyCd: item.itemTyCd,
                orgNatCd: item.orgNatCd,
                pkgUnitCd: item.pkgUnitCd,
                qtyUnitCd: item.qtyUnitCd
            });
        }
    }

    return res.status(httpStatus.OK).json({
        success: true,
        message: 'EBM Products Imported Successfully.'
    });
});


module.exports = {
    newProducts,
    editProduct,
    allProducts,
    importEbmProducts
};
