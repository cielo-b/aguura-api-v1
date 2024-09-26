const express = require("express");
const auth = require("../../middlewares/auth");
const { inventoryController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new",
  auth(["admin", "distributor", "producer"]),
  inventoryController.newInventory,
);
router.patch(
  "/edit",
  auth(["admin", "distributor", "producer"]),
  inventoryController.editInventory,
);
router.get(
  "/all-inventories",
  auth(["admin", "distributor", "producer"]),
  inventoryController.allInventory,
);
router.get(
  "/daily-inventory/day",
  auth(["admin", "distributor", "producer"]),
  inventoryController.dailyInventory,
);
router.get(
  "/stats",
  auth(["admin", "distributor", "producer"]),
  inventoryController.inventoryStats,
);

module.exports = router;

// Swagger documentation for the Inventory routes
/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Management of inventory items
 */

/**
 * @swagger
 * /inventory/new:
 *   post:
 *     summary: Create a new inventory item
 *     description: Adds a new item to the inventory
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Product A'
 *               quantity:
 *                 type: integer
 *                 example: 100
 *               price:
 *                 type: number
 *                 example: 29.99
 *               category:
 *                 type: string
 *                 example: 'Electronics'
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Inventory item created successfully'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory/edit:
 *   patch:
 *     summary: Edit an existing inventory item
 *     description: Updates the details of a specific inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *               quantity:
 *                 type: integer
 *                 example: 150
 *               price:
 *                 type: number
 *                 example: 34.99
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Inventory item updated successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory/all-inventories:
 *   get:
 *     summary: Get all inventory items
 *     description: Retrieves a list of all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inventory'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory/daily-inventory/day:
 *   get:
 *     summary: Get daily inventory
 *     description: Retrieves the inventory for the current day
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inventory'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory/stats:
 *   get:
 *     summary: Get inventory statistics
 *     description: Retrieves statistical data related to inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                   example: 500
 *                 totalValue:
 *                   type: number
 *                   example: 14999.50
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
