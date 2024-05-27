const express = require('express');
const auth = require('../../middlewares/auth');
const {credidController} = require('../../controllers');

const router = express.Router();

router.post('/pay', auth(['admin', 'producer', 'distributor']), credidController.payCredit);
router.get('/all-credits', auth(['admin', 'producer', 'distributor']), credidController.adminCredits);
router.get('/my-credits', auth(['user', 'producer', 'distributor']), credidController.myCredits);
router.get('/entity-credits', auth(['user', 'producer', 'distributor', 'admin']), credidController.entityCredits);

module.exports = router;