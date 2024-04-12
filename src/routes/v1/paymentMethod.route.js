const express = require('express');
const auth = require('../../middlewares/auth');
const {paymentMethodController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth('admin'), paymentMethodController.newMethod);
router.patch('/edit/:methodId', auth('admin'), paymentMethodController.editMethod);
router.get('/all-method', auth('admin'), paymentMethodController.allmethods);

module.exports = router;