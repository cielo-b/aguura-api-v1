const express = require('express');
const auth = require('../../middlewares/auth');
const {activeDayController} = require('../../controllers');

const router = express.Router();

router.get('/active', auth('admin'), activeDayController.getActiveDay);
router.get('/all-days', auth('admin'), activeDayController.getActiveDays);
router.post('/start', auth('admin'), activeDayController.startDay);
router.patch('/end/:id', auth('admin'), activeDayController.endDay);
router.get('/download-report', auth('admin'), activeDayController.downloadReport);

module.exports = router;