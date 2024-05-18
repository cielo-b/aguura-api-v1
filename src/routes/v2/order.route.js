const express = require('express');
const auth = require('../../middlewares/auth');
const {orderController} = require('../../controllers');

const router = express.Router();

router.patch('/complete', auth(['admin', 'producer', 'distributor']), orderController.completeOrder);
router.patch('/invent', auth(['admin', 'distributor']), orderController.inventOrder);

router.post('/new-distributor-order', auth('distributor'), orderController.newDistributorOrder);
router.post('/edit-distributor-order', auth('distributor'), orderController.editDistributorOrder);
router.get('/producer-orders', auth('producer'), orderController.getProducerOrders);
router.get('/distributor-orders', auth('distributor'), orderController.getDistributorOrders);

router.post('/new-stock-order', auth('admin'), orderController.newStockOrder);
router.get('/stock-orders', auth('admin'), orderController.getStockOrders);
router.post('/edit-stock-order', auth('admin'), orderController.editStockOrder);

router.post('/new', auth('user'), orderController.newOrder);
router.patch('/edit-order', auth('user'), orderController.editOrder);
router.get('/my-orders', auth('user'), orderController.myOrders);
router.get('/all-orders', auth('admin'), orderController.adminOrders);

module.exports = router;