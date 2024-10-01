const express = require("express");
const auth = require("../../middlewares/auth");
const { inventoryProductController } = require("../../controllers");
const { multipleUpload } = require("../../config/multer");

const router = express.Router();

router.post(
  "/distributor/add-products",
  auth("distributor"),
  inventoryProductController.addDistributorProducts,
);
router.get(
  "/all-distributor-products",
  auth(["distributor", "superAdmin", "admin"]),
  inventoryProductController.getDistributorProducts,
);

router.post(
  "/stock/new-product",
  auth("admin"),
  multipleUpload,
  inventoryProductController.newStockProduct,
);
router.post(
  "/stock/edit-product/:productId",
  auth("admin"),
  multipleUpload,
  inventoryProductController.edit,
);
router.post(
  "/stock/add-products",
  auth("admin"),
  inventoryProductController.addStockProducts,
);
router.get(
  "/all-stock-products",
  auth(["admin", "superAdmin","user"]),
  inventoryProductController.getStockProducts,
);

router.patch(
  "/edit-product/:productId",
  auth(["admin", "distributor"]),
  inventoryProductController.editProduct,
);
router.get(
  "/all-products",
  auth(["admin", "superAdmin"]),
  inventoryProductController.allProducts,
);
router.post(
  "/import-ebm-products",
  auth(["distributor", "admin"]),
  inventoryProductController.importEbmProducts,
);

module.exports = router;



// Swagger documentation for the Inventory Product routes
/**
 * @swagger
 * tags:
 *   name: InventoryProduct
 *   description: Management of inventory products
 */

/**
 * @swagger
 * /inventory-product/distributor/add-products:
 *   post:
 *     summary: Add products by distributor
 *     description: Allows a distributor to add new products to the inventory
 *     tags: [InventoryProduct]
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
 *         description: Product added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Product added successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory-product/all-distributor-products:
 *   get:
 *     summary: Get all distributor products
 *     description: Retrieves a list of all products added by distributors
 *     tags: [InventoryProduct]
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
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory-product/stock/new-product:
 *   post:
 *     summary: Add a new product to stock
 *     description: Allows admin to add a new product to stock with images
 *     tags: [InventoryProduct]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Stock Product A'
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               price:
 *                 type: number
 *                 example: 39.99
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Stock product added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Stock product added successfully'
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
 * /inventory-product/stock/edit-product/{productId}:
 *   post:
 *     summary: Edit a product in stock
 *     description: Allows admin to edit an existing product in stock
 *     tags: [InventoryProduct]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to edit
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Updated Stock Product A'
 *               quantity:
 *                 type: integer
 *                 example: 60
 *               price:
 *                 type: number
 *                 example: 44.99
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Product updated successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory-product/stock/add-products:
 *   post:
 *     summary: Add multiple products to stock
 *     description: Allows admin to add multiple products to stock
 *     tags: [InventoryProduct]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: 'Product B'
 *                 quantity:
 *                   type: integer
 *                   example: 150
 *                 price:
 *                   type: number
 *                   example: 19.99
 *     responses:
 *       201:
 *         description: Products added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Products added successfully'
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
 * /inventory-product/all-stock-products:
 *   get:
 *     summary: Get all stock products
 *     description: Retrieves a list of all products in stock
 *     tags: [InventoryProduct]
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
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory-product/edit-product/{productId}:
 *   patch:
 *     summary: Edit a product
 *     description: Allows admin or distributor to edit an existing product
 *     tags: [InventoryProduct]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Updated Product'
 *               quantity:
 *                 type: integer
 *                 example: 200
 *               price:
 *                 type: number
 *                 example: 29.99
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Product updated successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory-product/all-products:
 *   get:
 *     summary: Get all products
 *     description: Retrieves a list of all products available
 *     tags: [InventoryProduct]
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
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /inventory-product/import-ebm-products:
 *   post:
 *     summary: Import EBM products
 *     description: Allows distributor or admin to import EBM products
 *     tags: [InventoryProduct]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['60c72b2f9b1d4b3b88e3c1a1', '60c72b2f9b1d4b3b88e3c1a2']
 *     responses:
 *       200:
 *         description: Products imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Products imported successfully'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

