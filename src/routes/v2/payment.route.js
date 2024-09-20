const express = require("express");
const auth = require("../../middlewares/auth");
const { paymentController } = require("../../controllers");

const router = express.Router();

router.get(
  "/all-payments",
  auth(["admin", "producer", "distributor"]),
  paymentController.allPayments,
);
router.get(
  "/daily-payments/day",
  auth(["admin", "producer", "distributor"]),
  paymentController.dailyPayments,
);

module.exports = router;
