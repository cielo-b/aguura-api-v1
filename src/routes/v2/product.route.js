const express = require('express');
const auth = require('../../middlewares/auth');
const {productController} = require('../../controllers');

const router = express.Router();

router.post('/new', productController.newProducts);
router.patch('/edit-product/:productId', auth('producer'), productController.editProduct);
router.get('/all-products', auth('producer'), productController.allProducts);

module.exports = router;