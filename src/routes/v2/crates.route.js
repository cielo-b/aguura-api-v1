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


// Swagger documentation for the Crates routes
/**
 * @swagger
 * tags:
 *   name: Crates
 *   description: Crates management and operations
 */

/**
 * @swagger
 * /crates/new-render:
 *   post:
 *     summary: Create a new crates render
 *     description: Initializes a new crates render with specified details
 *     tags: [Crates]
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
 *                 example: 'Sample Crate'
 *               location:
 *                 type: string
 *                 example: 'Warehouse A'
 *               quantity:
 *                 type: integer
 *                 example: 100
 *               producerId:
 *                 type: string
 *                 example: '607f1f77bcf86cd799439011'
 *     responses:
 *       201:
 *         description: Crates render created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Crate'
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
 * /crates/edit:
 *   patch:
 *     summary: Edit existing crates
 *     description: Updates the details of an existing crate
 *     tags: [Crates]
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
 *                 example: '607f1f77bcf86cd799439012'
 *               name:
 *                 type: string
 *                 example: 'Updated Crate'
 *               location:
 *                 type: string
 *                 example: 'Warehouse B'
 *               quantity:
 *                 type: integer
 *                 example: 150
 *     responses:
 *       200:
 *         description: Crate edited successfully
 *       400:
 *         description: Crate not found or invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /crates/return/{id}:
 *   patch:
 *     summary: Return a crate
 *     description: Marks a crate as returned based on the provided ID
 *     tags: [Crates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the crate to return
 *         schema:
 *           type: string
 *           example: '607f1f77bcf86cd799439012'
 *     responses:
 *       200:
 *         description: Crate returned successfully
 *       400:
 *         description: Crate not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /crates/all-crates:
 *   get:
 *     summary: Get all crates
 *     description: Retrieves a list of all crates
 *     tags: [Crates]
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
 *                 $ref: '#/components/schemas/Crate'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /crates/my-crates:
 *   get:
 *     summary: Get my crates
 *     description: Retrieves a list of crates associated with the authenticated user
 *     tags: [Crates]
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
 *                 $ref: '#/components/schemas/Crate'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
