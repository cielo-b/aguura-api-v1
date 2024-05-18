const express = require('express');
const auth = require('../../middlewares/auth');
const {distributionPointController} = require('../../controllers');

const router = express.Router();

router.post('/new', distributionPointController.newDistributionPoint);
router.patch('/edit-point/:distributionPointId', auth('distributor'), distributionPointController.editDistributionPoint);
router.get('/by-manager', auth('distributor'), distributionPointController.getPointByManager);
router.get('/single', auth('distributor'), distributionPointController.getDistributionPoint);
router.get('/stocks', auth('distributor'), distributionPointController.getStocks);
router.get('/all-distributors', auth(['distributor', 'admin']), distributionPointController.getAllDistributionPoints);

module.exports = router;