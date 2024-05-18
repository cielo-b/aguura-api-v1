const express = require('express');
const auth = require('../../middlewares/auth');
const {inventoryProductController} = require('../../controllers');

const router = express.Router();

router.post('/distributor/add-products', auth('distributor'), inventoryProductController.addDistributorProducts);
router.get('/all-distributor-products', auth('distributor'), inventoryProductController.getDistributorProducts);

router.post('/stock/add-products', auth('admin'), inventoryProductController.addStockProducts);
router.get('/all-stock-products', auth('admin'), inventoryProductController.getStockProducts);

router.patch('/edit-product/:productId', auth(['admin', 'distributor']), inventoryProductController.editProduct);
router.get('/all-products', auth(['admin', 'superAdmin']), inventoryProductController.allProducts);

module.exports = router;