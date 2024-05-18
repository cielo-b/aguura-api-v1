const express = require('express');
const auth = require('../../middlewares/auth');
const {salesController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth(['admin', 'producer', 'distributor']), salesController.newSales);
router.patch('/edit', auth(['admin', 'producer', 'distributor']), salesController.editSales);
router.get('/all-sales', auth(['admin', 'producer', 'distributor']), salesController.allSales);
router.get('/daily-sales/day', auth(['admin', 'producer', 'distributor']), salesController.dailySales);
router.get('/stats', auth(['admin', 'producer', 'distributor']), salesController.salesStats);

module.exports = router;