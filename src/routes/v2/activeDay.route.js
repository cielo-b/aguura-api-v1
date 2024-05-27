const express = require('express');
const auth = require('../../middlewares/auth');
const {activeDayController} = require('../../controllers');

const router = express.Router();

router.get('/active', auth(['admin', 'distributor', 'producer']), activeDayController.getActiveDay);
router.get('/all-days', auth(['admin', 'distributor', 'producer']), activeDayController.getActiveDays);
router.post('/start', auth(['admin', 'distributor', 'producer']), activeDayController.startDay);
router.patch('/end', auth(['admin', 'distributor', 'producer']), activeDayController.endDay);
router.get('/download-report', auth(['admin', 'distributor', 'producer']), activeDayController.downloadReport);

module.exports = router;