const express = require('express');
const auth = require('../../middlewares/auth');
const {salesController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth('admin'), salesController.newSales);
router.patch('/edit', auth('admin'), salesController.editSales);
router.get('/all-sales', auth('admin'), salesController.allSales);
router.get('/daily-sales/day/:dayId', auth('admin'), salesController.dailySales);
router.get('/stats', auth('admin'), salesController.salesStats);

module.exports = router;