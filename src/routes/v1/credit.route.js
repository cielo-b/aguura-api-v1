const express = require('express');
const auth = require('../../middlewares/auth');
const {credidController} = require('../../controllers');

const router = express.Router();

router.post('/pay', auth('admin'), credidController.payCredit);
router.get('/all-credits', auth('admin'), credidController.adminCredits);
router.get('/my-credits', auth('user'), credidController.myCredits);

module.exports = router;