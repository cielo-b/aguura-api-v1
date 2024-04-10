const express = require('express');
const auth = require('../../middlewares/auth');
const {salesProductController} = require('../../controllers');

const router = express.Router();

router.post('/new-product', auth('admin'), salesProductController.newProduct);
router.patch('/edit-product/:productId', auth('admin'), salesProductController.editProduct);
router.get('/all-products', auth('admin'), salesProductController.allProducts);

module.exports = router;