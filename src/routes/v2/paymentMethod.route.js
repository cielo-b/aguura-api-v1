const express = require("express");
const auth = require("../../middlewares/auth");
const { paymentMethodController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new",
  auth(["admin", "producer", "distributor"]),
  paymentMethodController.newMethod,
);
router.patch(
  "/edit/:methodId",
  auth(["admin", "producer", "distributor"]),
  paymentMethodController.editMethod,
);
router.get(
  "/all-methods",
  auth(["admin", "producer", "distributor"]),
  paymentMethodController.allmethods,
);

module.exports = router;
