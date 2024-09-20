const express = require("express");
const auth = require("../../middlewares/auth");
const { stockController } = require("../../controllers");

const router = express.Router();

router.post("/new", auth("superAdmin"), stockController.newStock);
router.patch("/add-stocks", auth("user"), stockController.addStocks);
router.patch(
  "/edit-stock/:stockId",
  auth("superAdmin"),
  stockController.editStock,
);
router.get("/all-stocks", auth("superAdmin"), stockController.allStocks);
router.get("/get", auth([]), stockController.getStock);
router.get("/by-admin", auth("admin"), stockController.getStockByAdmin);
router.get("/by-user", auth("user"), stockController.getStockByCustomer);
router.get("/my-stocks", auth("user"), stockController.myStocks);
router.get("/all-available-stocks", auth("user"), stockController.getAllStocks);

module.exports = router;
