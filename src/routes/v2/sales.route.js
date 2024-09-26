const express = require("express");
const auth = require("../../middlewares/auth");
const { salesController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new",
  auth(["admin", "producer", "distributor"]),
  salesController.newSales,
);
router.patch(
  "/edit",
  auth(["admin", "producer", "distributor"]),
  salesController.editSales,
);
router.get(
  "/all-sales",
  auth(["admin", "producer", "distributor"]),
  salesController.allSales,
);
router.get(
  "/daily-sales/day",
  auth(["admin", "producer", "distributor"]),
  salesController.dailySales,
);
router.get("/sale-by-id", salesController.getSaleById);
router.get(
  "/stats",
  auth(["admin", "producer", "distributor"]),
  salesController.salesStats,
);

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Operations related to sales
 */

/**
 * @swagger
 * /sales/new:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityId:
 *                 type: string
 *                 description: ID of the entity (e.g., producer, distributor)
 *               entityType:
 *                 type: string
 *                 description: Type of the entity (e.g., producer, distributor)
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: ID of the product
 *                     quantity:
 *                       type: integer
 *                       description: Quantity sold
 *                     price:
 *                       type: number
 *                       description: Price of the product
 *               totalPrice:
 *                 type: number
 *                 description: Total price of the sale
 *               customerName:
 *                 type: string
 *                 description: Name of the customer
 *               customerPhone:
 *                 type: string
 *                 description: Phone number of the customer
 *     responses:
 *       201:
 *         description: Sale created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sale created successfully."
 *       403:
 *         description: Forbidden, user does not have permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied."
 */

/**
 * @swagger
 * /sales/edit:
 *   patch:
 *     summary: Edit an existing sale
 *     tags: [Sales]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               saleId:
 *                 type: string
 *                 description: ID of the sale to edit
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: ID of the product
 *                     quantity:
 *                       type: integer
 *                       description: New quantity
 *                     price:
 *                       type: number
 *                       description: New price
 *               totalPrice:
 *                 type: number
 *                 description: Updated total price of the sale
 *               customerName:
 *                 type: string
 *                 description: Updated name of the customer
 *               customerPhone:
 *                 type: string
 *                 description: Updated phone number of the customer
 *     responses:
 *       200:
 *         description: Sales edited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sales edited successfully."
 *       404:
 *         description: Sale not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sale not found."
 */

/**
 * @swagger
 * /sales/all-sales:
 *   get:
 *     summary: Retrieve all sales for a specific entity
 *     tags: [Sales]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the entity
 *       - in: query
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           description: Type of the entity (e.g., producer, distributor)
 *     responses:
 *       200:
 *         description: Successfully retrieved sales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sales:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       // Sale object structure
 *       404:
 *         description: Entity not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Entity Not Found."
 */

/**
 * @swagger
 * /sales/daily-sales:
 *   get:
 *     summary: Retrieve sales for a specific entity on a specific day
 *     tags: [Sales]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the entity
 *       - in: query
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           description: Type of the entity (e.g., producer, distributor)
 *       - in: query
 *         name: dayId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the active day
 *     responses:
 *       200:
 *         description: Successfully retrieved daily sales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sales:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       // Sale object structure
 *       404:
 *         description: Entity not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Entity Not Found."
 *       400:
 *         description: No active day
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No Active Day, Plz Start New Day And Try Again."
 */

/**
 * @swagger
 * /sales/sale-by-id:
 *   get:
 *     summary: Retrieve a specific sale by its ID
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: saleId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the sale to retrieve
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the associated entity
 *     responses:
 *       200:
 *         description: Successfully retrieved sale
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 saleData:
 *                   type: object
 *                   properties:
 *                     sale:
 *                       type: object
 *                       description: Sale object structure
 *                     entity:
 *                       type: object
 *                       description: Entity object structure
 *       404:
 *         description: Sale or entity not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sale not found."
 */

/**
 * @swagger
 * /sales/stats:
 *   get:
 *     summary: Retrieve sales statistics for a specific stock
 *     tags: [Sales]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: query
 *         name: stockId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the stock for which statistics are to be fetched
 *     responses:
 *       200:
 *         description: Successfully retrieved sales statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSales:
 *                       type: integer
 *                       example: 100
 *                     totalAmountSold:
 *                       type: number
 *                       example: 5000
 */
