const express = require('express');
const auth = require('../../middlewares/auth');
const {salesProductController} = require('../../controllers');

const router = express.Router();

router.post('/new-products', auth(['admin', 'producer', 'distributor']), salesProductController.newProduct);
router.patch('/edit-product/:productId', auth(['admin', 'producer', 'distributor']), salesProductController.editProduct);
router.get('/all-products', auth(['admin', 'superAdmin', 'user', 'producer', 'distributor']), salesProductController.allProducts);
router.get('/available-products', auth(), salesProductController.availableProducts);

module.exports = router;