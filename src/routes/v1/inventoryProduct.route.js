const express = require('express');
const auth = require('../../middlewares/auth');
const {inventoryProductController} = require('../../controllers');

const router = express.Router();

router.post('/new-inventory-product', auth('admin'), inventoryProductController.newProduct);
router.patch('/edit-inventory-product', auth('admin'), inventoryProductController.editProduct);
router.get('/all-inventory-products', auth('admin'), inventoryProductController.allProducts);

module.exports = router;