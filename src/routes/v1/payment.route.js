const express = require('express');
const auth = require('../../middlewares/auth');
const {paymentController} = require('../../controllers');

const router = express.Router();

router.get('/all-payments', auth('admin'), paymentController.allPayments);
router.get('/daily-payments/day/:dayId', auth('admin'), paymentController.dailyPayments);

module.exports = router;