const express = require('express');
const auth = require('../../middlewares/auth');
const {orderController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth('user'), orderController.newOrder);
router.patch('/edit-order', auth('user'), orderController.editOrder);
router.patch('/complete/:id', auth('admin'), orderController.completeOrder);
router.get('/my-orders', auth('user'), orderController.myOrders);
router.get('/all-orders', auth('admin'), orderController.adminOrders);

module.exports = router;