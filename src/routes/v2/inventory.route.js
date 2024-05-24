const express = require('express');
const auth = require('../../middlewares/auth');
const {inventoryController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth(['admin', 'distributor', 'producer']), inventoryController.newInventory);
router.patch('/edit', auth(['admin', 'distributor', 'producer']), inventoryController.editInventory);
router.get('/all-inventories', auth(['admin', 'distributor', 'producer']), inventoryController.allInventory);
router.get('/daily-inventory/day', auth(['admin', 'distributor', 'producer']), inventoryController.dailyInventory);
router.get('/stats', auth(['admin', 'distributor', 'producer']), inventoryController.inventoryStats);

module.exports = router;