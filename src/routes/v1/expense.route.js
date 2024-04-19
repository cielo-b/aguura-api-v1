const express = require('express');
const auth = require('../../middlewares/auth');
const {expenseController} = require('../../controllers');

const router = express.Router();

router.post('/new', auth('admin'), expenseController.newExpense);
router.patch('/edit/:id', auth('admin'), expenseController.editExpense);
router.get('/daily-expenses', auth('admin'), expenseController.dailyExpenses);
router.get('/all-expenses', auth('admin'), expenseController.allExpenses);

module.exports = router;