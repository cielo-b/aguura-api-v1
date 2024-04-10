const express = require('express');
const auth = require('../../middlewares/auth');
const {activeDayController} = require('../../controllers');

const router = express.Router();

router.post('/start-day', auth('admin'), activeDayController.startDay);
router.patch('/end-day/day/:id', auth('admin'), activeDayController.endDay);

module.exports = router;