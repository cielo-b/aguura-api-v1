const express = require('express');
const auth = require('../../middlewares/auth');
const {inventoryController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth('admin'), inventoryController.newInventory);
router.patch('/edit', auth('admin'), inventoryController.editInventory);
router.get('/all-inventories', auth('admin'), inventoryController.allInventory);
router.get('/daily-inventory/day/:dayId', auth('admin'), inventoryController.dailyInventory);
router.get('/stats', auth('admin'), inventoryController.inventoryStats);

module.exports = router;