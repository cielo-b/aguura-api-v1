const express = require("express");
const auth = require("../../middlewares/auth");
const { creditController } = require("../../controllers");

const router = express.Router();

router.post(
  "/pay",
  auth(["admin", "producer", "distributor"]),
  creditController.payCredit,
);
router.get(
  "/all-credits",
  auth(["admin", "producer", "distributor"]),
  creditController.adminCredits,
);
router.get(
  "/my-credits",
  auth(["user", "producer", "distributor"]),
  creditController.myCredits,
);
router.get(
  "/entity-credits",
  auth(["user", "producer", "distributor", "admin"]),
  creditController.entityCredits,
);

module.exports = router;

// Swagger documentation for the Credit routes
/**
 * @swagger
 * tags:
 *   name: Credit
 *   description: Credit management and operations
 */

/**
 * @swagger
 * /credits/pay:
 *   post:
 *     summary: Pay credit
 *     description: Processes a payment for a specified credit
 *     tags: [Credit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               creditId:
 *                 type: string
 *                 example: '607f1f77bcf86cd799439012'
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 100.50
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Payment successful'
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
 * /credits/all-credits:
 *   get:
 *     summary: Get all credits
 *     description: Retrieves a list of all credits for admin
 *     tags: [Credit]
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
 *                 $ref: '#/components/schemas/Credit'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /credits/my-credits:
 *   get:
 *     summary: Get my credits
 *     description: Retrieves a list of credits associated with the authenticated user
 *     tags: [Credit]
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
 *                 $ref: '#/components/schemas/Credit'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /credits/entity-credits:
 *   get:
 *     summary: Get entity credits
 *     description: Retrieves a list of credits for a specific entity
 *     tags: [Credit]
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
 *                 $ref: '#/components/schemas/Credit'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
