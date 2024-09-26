const express = require("express");
const auth = require("../../middlewares/auth");
const { paymentController } = require("../../controllers");

const router = express.Router();

router.get(
  "/all-payments",
  auth(["admin", "producer", "distributor"]),
  paymentController.allPayments,
);
router.get(
  "/daily-payments/day",
  auth(["admin", "producer", "distributor"]),
  paymentController.dailyPayments,
);

module.exports = router;


// Swagger documentation for the Payment routes
/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Management of payments
 */

/**
 * @swagger
 * /payment/all-payments:
 *   get:
 *     summary: Get all payments
 *     description: Retrieves a list of all payments
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /payment/daily-payments/day:
 *   get:
 *     summary: Get daily payments
 *     description: Retrieves a list of daily payments for a specified day
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-09-25'
 *     responses:
 *       200:
 *         description: A list of daily payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */


