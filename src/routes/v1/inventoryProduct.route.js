const express = require('express');
const auth = require('../../middlewares/auth');
const {inventoryProductController} = require('../../controllers');

const router = express.Router();

router.post('/new-product', auth('admin'), inventoryProductController.newProduct);
router.patch('/edit-product/:productId', auth('admin'), inventoryProductController.editProduct);
router.get('/all-products', auth(['admin', 'superAdmin']), inventoryProductController.allProducts);

module.exports = router;