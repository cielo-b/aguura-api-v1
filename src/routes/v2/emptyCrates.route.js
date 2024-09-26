const express = require("express");
const auth = require("../../middlewares/auth");
const { emptyCratesController } = require("../../controllers");

const router = express.Router();

router.post(
  "/register",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.registerEmptyCrates,
);
router.patch(
  "/edit",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.editEmptyCrate,
);
router.patch(
  "/remove",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.removeEmptyCrates,
);
router.get(
  "/all",
  auth(["admin", "distributor", "producer"]),
  emptyCratesController.getEmptyCrates,
);

module.exports = router;


// Swagger documentation for the Empty Crates routes
/**
 * @swagger
 * tags:
 *   name: EmptyCrates
 *   description: Management of empty crates
 */

/**
 * @swagger
 * /empty-crates/register:
 *   post:
 *     summary: Register new empty crates
 *     description: Adds new empty crates to the system
 *     tags: [EmptyCrates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 100
 *               description:
 *                 type: string
 *                 example: 'New batch of empty crates'
 *     responses:
 *       201:
 *         description: Empty crates registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Empty crates registered successfully'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /empty-crates/edit:
 *   patch:
 *     summary: Edit an existing empty crate
 *     description: Updates the details of a specific empty crate
 *     tags: [EmptyCrates]
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
 *               description:
 *                 type: string
 *                 example: 'Updated batch of empty crates'
 *     responses:
 *       200:
 *         description: Empty crate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Empty crate updated successfully'
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
 * /empty-crates/remove:
 *   patch:
 *     summary: Remove empty crates
 *     description: Removes a specified number of empty crates from the system
 *     tags: [EmptyCrates]
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
 *                 example: 50
 *     responses:
 *       200:
 *         description: Empty crates removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Empty crates removed successfully'
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
 * /empty-crates/all:
 *   get:
 *     summary: Get all empty crates
 *     description: Retrieves a list of all empty crates
 *     tags: [EmptyCrates]
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
 *                 $ref: '#/components/schemas/EmptyCrate'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */


