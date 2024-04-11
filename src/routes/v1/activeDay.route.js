const express = require('express');
const auth = require('../../middlewares/auth');
const {activeDayController} = require('../../controllers');

const router = express.Router();

router.get('/active', auth('admin'), activeDayController.getActiveDay);
router.post('/start', auth('admin'), activeDayController.startDay);
router.patch('/end/:id', auth('admin'), activeDayController.endDay);

module.exports = router;