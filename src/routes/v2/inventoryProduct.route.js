const express = require('express');
const auth = require('../../middlewares/auth');
const {inventoryProductController} = require('../../controllers');
const {multipleUpload} = require('../../config/multer');

const router = express.Router();

router.post('/distributor/add-products', auth('distributor'), inventoryProductController.addDistributorProducts);
router.get('/all-distributor-products', auth(['distributor', 'superAdmin', 'admin']), inventoryProductController.getDistributorProducts);

router.post('/stock/new-product', auth('admin'), multipleUpload, inventoryProductController.newStockProduct);
router.post('/stock/edit-product/:productId', auth('admin'), multipleUpload, inventoryProductController.edit);
router.post('/stock/add-products', auth('admin'), inventoryProductController.addStockProducts);
router.get('/all-stock-products', auth(['admin', 'superAdmin']), inventoryProductController.getStockProducts);

router.patch('/edit-product/:productId', auth(['admin', 'distributor']), inventoryProductController.editProduct);
router.get('/all-products', auth(['admin', 'superAdmin']), inventoryProductController.allProducts);
router.post('/import-ebm-products', auth(['distributor', 'admin']), inventoryProductController.importEbmProducts);

module.exports = router;