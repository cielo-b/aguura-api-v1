const express = require('express');
const auth = require('../../middlewares/auth');
const {stockController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth('superAdmin'), stockController.newStock);
router.patch('/edit-stock/:stockId', auth('superAdmin'), stockController.editStock);
router.get('/all-stocks', auth('superAdmin'), stockController.allStocks);
router.get('/get', auth([]), stockController.getStock);
router.get('/by-admin', auth('admin'), stockController.getStockByAdmin);

module.exports = router;