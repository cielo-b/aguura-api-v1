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


/**
 * @swagger
 * tags:
 *   name: Stocks
 *   description: Operations related to stocks
 */

/**
 * @swagger
 * /stocks/new:
 *   post:
 *     summary: Create a new stock
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the stock
 *               location:
 *                 type: string
 *                 description: The location of the stock
 *     responses:
 *       201:
 *         description: Stock created successfully
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
 *                   example: "Stock created successfully."
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
 * /stocks/add-stocks:
 *   patch:
 *     summary: Add stocks to an existing stock
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockId:
 *                 type: string
 *                 description: ID of the stock to add to
 *               quantity:
 *                 type: number
 *                 description: The quantity to add
 *     responses:
 *       200:
 *         description: Stocks added successfully
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
 *                   example: "Stocks added successfully."
 *       400:
 *         description: Bad request
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
 *                   example: "Stock not found."
 */

/**
 * @swagger
 * /stocks/edit-stock/{stockId}:
 *   patch:
 *     summary: Edit an existing stock
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: stockId
 *         required: true
 *         description: ID of the stock to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name of the stock
 *               location:
 *                 type: string
 *                 description: The new location of the stock
 *     responses:
 *       200:
 *         description: Stock edited successfully
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
 *                   example: "Stock edited successfully."
 *       404:
 *         description: Stock not found
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
 *                   example: "Stock not found."
 */

/**
 * @swagger
 * /stocks/all-stocks:
 *   get:
 *     summary: Get all stocks
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: A list of all stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stocks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
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
 * /stocks/get:
 *   get:
 *     summary: Get stock details
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: query
 *         name: stockId
 *         required: true
 *         description: ID of the stock to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stock:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     location:
 *                       type: string
 *       404:
 *         description: Stock not found
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
 *                   example: "Stock not found."
 */

/**
 * @swagger
 * /stocks/by-admin:
 *   get:
 *     summary: Get stocks managed by admin
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: A list of stocks managed by admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stocks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
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
 * /stocks/by-user:
 *   get:
 *     summary: Get stocks for a user
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: A list of stocks for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stocks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
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
 * /stocks/my-stocks:
 *   get:
 *     summary: Get stocks owned by the user
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: A list of stocks owned by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stocks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
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
 * /stocks/all-available-stocks:
 *   get:
 *     summary: Get all available stocks
 *     tags: [Stocks]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: A list of all available stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stocks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
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


