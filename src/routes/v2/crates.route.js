const express = require("express");
const auth = require("../../middlewares/auth");
const { cratesController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new-render",
  auth(["admin", "distributor", "producer"]),
  cratesController.newCratesRender,
);
router.patch(
  "/edit",
  auth(["admin", "distributor", "producer"]),
  cratesController.editCrates,
);
router.patch(
  "/return/:id",
  auth(["admin", "distributor", "producer"]),
  cratesController.returnCrates,
);
router.get(
  "/all-crates",
  auth(["admin", "distributor", "producer"]),
  cratesController.allCrates,
);
router.get(
  "/my-crates",
  auth(["admin", "distributor", "producer", "user"]),
  cratesController.myCrates,
);

module.exports = router;
