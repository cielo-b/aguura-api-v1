const express = require("express");
const auth = require("../../middlewares/auth");
const { emptyCratesController } = require("../../controllers");

const router = express.Router();

router.post(
  "/register",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.registerEmptyCrates,
);
router.patch(
  "/edit",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.editEmptyCrate,
);
router.patch(
  "/remove",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.removeEmptyCrates,
);
router.get(
  "/all",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.getEmptyCrates,
);

module.exports = router;
