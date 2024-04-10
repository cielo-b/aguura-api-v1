const express = require('express');
const auth = require('../../middlewares/auth');
const {salesProductController} = require('../../controllers');

const router = express.Router();

router.post('/new-sales-product', auth('admin'), salesProductController.newProduct);
router.patch('/edit-sales-product', auth('admin'), salesProductController.editProduct);
router.get('/all-sales-products', auth('admin'), salesProductController.allProducts);

module.exports = router;