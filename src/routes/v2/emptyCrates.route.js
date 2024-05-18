const express = require('express');
const auth = require('../../middlewares/auth');
const {emptyCratesController} = require('../../controllers');

const router = express.Router();

router.post('/register', auth(['admin', 'distributor']), emptyCratesController.registerEmptyCrates);
router.patch('/edit', auth(['admin', 'distributor']), emptyCratesController.editEmptyCrate);
router.patch('/remove', auth(['admin', 'distributor']), emptyCratesController.removeEmptyCrates);
router.get('/all', auth(['admin', 'distributor']), emptyCratesController.getEmptyCrates);

module.exports = router;