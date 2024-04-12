const express = require('express');
const auth = require('../../middlewares/auth');
const {cratesController} = require('../../controllers');

const router = express.Router();

router.post('/new-order', auth('admin'), cratesController.newCratesRender);
router.patch('/return/:id', auth('admin'), cratesController.returnCrates);
router.get('/all-crates', auth('admin'), cratesController.allCrates);

module.exports = router;