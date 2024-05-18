const express = require('express');
const auth = require('../../middlewares/auth');
const {inventoryController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth(['admin', 'distributor']), inventoryController.newInventory);
router.patch('/edit', auth(['admin', 'distributor']), inventoryController.editInventory);
router.get('/all-inventories', auth(['admin', 'distributor']), inventoryController.allInventory);
router.get('/daily-inventory/day', auth(['admin', 'distributor']), inventoryController.dailyInventory);
router.get('/stats', auth(['admin', 'distributor']), inventoryController.inventoryStats);

module.exports = router;