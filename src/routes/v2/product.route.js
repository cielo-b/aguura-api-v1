const express = require("express");
const auth = require("../../middlewares/auth");
const { productController } = require("../../controllers");

const router = express.Router();

router.post("/new", auth("producer"), productController.newProducts);
router.post(
  "/import-ebm-products",
  auth("producer"),
  productController.importEbmProducts,
);
router.patch(
  "/edit-product/:productId",
  auth("producer"),
  productController.editProduct,
);
router.get("/all-products", auth("producer"), productController.allProducts);

module.exports = router;

// Swagger documentation for the Product routes
/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Management of products
 */

/**
 * @swagger
 * /product/new:
 *   post:
 *     summary: Create a new product
 *     description: Adds a new product to the system
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'New Product'
 *               description:
 *                 type: string
 *                 example: 'Description of the new product'
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 19.99
 *               stock:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /product/import-ebm-products:
 *   post:
 *     summary: Import EBM products
 *     description: Imports products from EBM
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ebmData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: 'EBM Product'
 *                     description:
 *                       type: string
 *                       example: 'Description of the EBM product'
 *                     price:
 *                       type: number
 *                       format: float
 *                       example: 29.99
 *                     stock:
 *                       type: integer
 *                       example: 50
 *     responses:
 *       201:
 *         description: EBM products imported successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /product/edit-product/{productId}:
 *   patch:
 *     summary: Edit an existing product
 *     description: Updates the details of an existing product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
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
 *               name:
 *                 type: string
 *                 example: 'Updated Product Name'
 *               description:
 *                 type: string
 *                 example: 'Updated description of the product'
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 24.99
 *               stock:
 *                 type: integer
 *                 example: 120
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /product/all-products:
 *   get:
 *     summary: Get all products
 *     description: Retrieves a list of all products in the system
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
