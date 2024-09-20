const express = require("express");
const auth = require("../../middlewares/auth");
const { expenseController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new",
  auth(["admin", "producer", "distributor"]),
  expenseController.newExpense,
);
router.patch(
  "/edit",
  auth(["admin", "producer", "distributor"]),
  expenseController.editExpense,
);
router.get(
  "/daily-expenses",
  auth(["admin", "producer", "distributor"]),
  expenseController.dailyExpenses,
);
router.get(
  "/all-expenses",
  auth(["admin", "producer", "distributor"]),
  expenseController.allExpenses,
);

module.exports = router;
