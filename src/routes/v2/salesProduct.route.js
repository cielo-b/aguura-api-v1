const express = require("express");
const auth = require("../../middlewares/auth");
const { salesProductController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new-products",
  auth(["admin", "producer", "distributor"]),
  salesProductController.newProduct,
);
router.patch(
  "/edit-product/:productId",
  auth(["admin", "producer", "distributor"]),
  salesProductController.editProduct,
);
router.get(
  "/all-products",
  auth(["admin", "superAdmin", "user", "producer", "distributor"]),
  salesProductController.allProducts,
);
router.get("/available-products", salesProductController.availableProducts);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Sales Products
 *   description: Operations related to sales products
 */

/**
 * @swagger
 * /sales-products/new-products:
 *   post:
 *     summary: Create a new sales product
 *     tags: [Sales Products]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: The ID of the inventory product
 *                     price:
 *                       type: number
 *                       description: The price of the sales product
 *     responses:
 *       201:
 *         description: Products added successfully
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
 *                   example: "Products Added Successfully."
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
 *                   example: "Product Not Found."
 */

/**
 * @swagger
 * /sales-products/edit-product/{productId}:
 *   patch:
 *     summary: Edit a sales product
 *     tags: [Sales Products]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID of the product to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 description: The new price of the product
 *     responses:
 *       200:
 *         description: Product edited successfully
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
 *                   example: "Product Edited Successfully."
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
 *                   example: "Product Not Found."
 */

/**
 * @swagger
 * /sales-products/all-products:
 *   get:
 *     summary: Get all sales products
 *     tags: [Sales Products]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         required: true
 *         description: Type of the entity (e.g., stock, distribution point)
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         required: true
 *         description: ID of the entity
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of sales products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       producer:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       sizes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       details:
 *                         type: string
 *                       description:
 *                         type: string
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
 * /sales-products/available-products:
 *   get:
 *     summary: Get available sales products in a stock
 *     tags: [Sales Products]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: query
 *         name: stockId
 *         required: true
 *         description: ID of the stock to get available products from
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of available sales products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       number:
 *                         type: number
 *                       producer:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       sizes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       details:
 *                         type: string
 *                       description:
 *                         type: string
 *       404:
 *         description: No available products found
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
 *                   example: "No available products found."
 */
