const express = require('express');
const auth = require('../../middlewares/auth');
const {productController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth('producer'), productController.newProducts);
router.post('/import-ebm-products', auth('producer'), productController.importEbmProducts);
router.patch('/edit-product/:productId', auth('producer'), productController.editProduct);
router.get('/all-products', auth('producer'), productController.allProducts);

module.exports = router;