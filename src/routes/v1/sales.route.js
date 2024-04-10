const express = require('express');
const auth = require('../../middlewares/auth');
const {salesController} = require('../../controllers');

const router = express.Router();

router.post('/new-sales', auth('admin'), salesController.newSales);
router.get('/all-sales', auth('admin'), salesController.allSales);
router.get('/daily-sales/day/:dayId', auth('admin'), salesController.dailySales);

module.exports = router;