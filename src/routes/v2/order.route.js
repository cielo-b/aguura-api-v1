const express = require("express");
const auth = require("../../middlewares/auth");
const { orderController } = require("../../controllers");

const router = express.Router();

router.patch(
  "/complete",
  auth(["admin", "producer", "distributor"]),
  orderController.completeOrder,
);
router.patch(
  "/invent",
  auth(["admin", "distributor"]),
  orderController.inventOrder,
);

router.post(
  "/new-distributor-order",
  auth("distributor"),
  orderController.newDistributorOrder,
);
router.post(
  "/edit-distributor-order",
  auth("distributor"),
  orderController.editDistributorOrder,
);
router.get(
  "/producer-orders",
  auth("producer"),
  orderController.getProducerOrders,
);
router.get(
  "/distributor-orders",
  auth("distributor"),
  orderController.getDistributorOrders,
);

router.post("/new-stock-order", auth("admin"), orderController.newStockOrder);
router.get("/stock-orders", auth("admin"), orderController.getStockOrders);
router.post("/edit-stock-order", auth("admin"), orderController.editStockOrder);

router.post("/new", auth("user"), orderController.newOrder);
router.patch("/edit-order", auth("user"), orderController.editOrder);
router.get("/my-orders", auth("user"), orderController.myOrders);
router.get("/all-orders", auth("admin"), orderController.adminOrders);
router.patch(
  "/cancel-order",
  auth(["user", "admin", "distributor"]),
  orderController.cancelOrder,
);

module.exports = router;

// Swagger documentation for the Order routes
/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Management of orders
 */

/**
 * @swagger
 * /order/complete:
 *   patch:
 *     summary: Complete an order
 *     description: Marks an order as complete
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *     responses:
 *       200:
 *         description: Order completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Order completed successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/invent:
 *   patch:
 *     summary: Invent an order
 *     description: Marks an order for inventory processing
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a2'
 *     responses:
 *       200:
 *         description: Order marked for inventory successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Order marked for inventory successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/new-distributor-order:
 *   post:
 *     summary: Create a new distributor order
 *     description: Allows a distributor to create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *               quantity:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       201:
 *         description: Distributor order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Distributor order created successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/edit-distributor-order:
 *   post:
 *     summary: Edit a distributor order
 *     description: Allows a distributor to edit an existing order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *               quantity:
 *                 type: integer
 *                 example: 120
 *     responses:
 *       200:
 *         description: Distributor order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Distributor order updated successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/producer-orders:
 *   get:
 *     summary: Get orders for the producer
 *     description: Retrieves a list of orders for the producer
 *     tags: [Order]
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
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/distributor-orders:
 *   get:
 *     summary: Get orders for the distributor
 *     description: Retrieves a list of orders for the distributor
 *     tags: [Order]
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
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/new-stock-order:
 *   post:
 *     summary: Create a new stock order
 *     description: Allows an admin to create a new stock order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *               quantity:
 *                 type: integer
 *                 example: 200
 *     responses:
 *       201:
 *         description: Stock order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Stock order created successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/stock-orders:
 *   get:
 *     summary: Get all stock orders
 *     description: Retrieves a list of all stock orders
 *     tags: [Order]
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
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/edit-stock-order:
 *   post:
 *     summary: Edit a stock order
 *     description: Allows an admin to edit an existing stock order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *               quantity:
 *                 type: integer
 *                 example: 250
 *     responses:
 *       200:
 *         description: Stock order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Stock order updated successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/new:
 *   post:
 *     summary: Create a new order
 *     description: Allows a user to create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *               quantity:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Order created successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/edit-order:
 *   patch:
 *     summary: Edit an existing order
 *     description: Allows a user to edit an existing order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: '60c72b2f9b1d4b3b88e3c1a1'
 *               quantity:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Order updated successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/my-orders:
 *   get:
 *     summary: Get user's orders
 *     description: Retrieves a list of orders created by the user
 *     tags: [Order]
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
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /order/all-orders:
 *   get:
 *     summary: Get all orders
 *     description: Retrieves a list of all orders
 *     tags: [Order]
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
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

// /**
//  * @swagger
//  * /order/cancel-order:
//  *  patch:
//  *   summary: Cancel an order
//  *   description: Marks an order as cancelled
//  *   tags: [Order]
//  *   security:
//  *    - bearerAuth: []
//  *   requestBody:
//  *     required: true
//  *     content:
//  *     application/json:
//  *      schema:
//  *        type: object
//  *       properties:
//  *          orderId:
//  *         type: string
//  *         example: '60c72b2f9b1d4b3b88e3c1a1'
//  *   responses:
//  *    200:
//  *      description: Order cancelled successfully
//  *      content:
//  *        application/json:
//  *          schema:
//  *            type: object
//  *              properties:
//  *               message:
//  *                 type: string
//  *                 example: 'Order cancelled successfully'
//  *    400:
//  *      description: Bad request
//  *    401:
//  *      description: Unauthorized
//  *    403:
//  *      description: Forbidden
//  *    500:
//  *      description: Internal Server Error
//  */
