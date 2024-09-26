const express = require("express");
const auth = require("../../middlewares/auth");
const { paymentMethodController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new",
  auth(["admin", "producer", "distributor"]),
  paymentMethodController.newMethod,
);
router.patch(
  "/edit/:methodId",
  auth(["admin", "producer", "distributor"]),
  paymentMethodController.editMethod,
);
router.get(
  "/all-methods",
  auth(["admin", "producer", "distributor"]),
  paymentMethodController.allmethods,
);

module.exports = router;


// Swagger documentation for the PaymentMethod routes
/**
 * @swagger
 * tags:
 *   name: PaymentMethod
 *   description: Management of payment methods
 */

/**
 * @swagger
 * /payment-method/new:
 *   post:
 *     summary: Create a new payment method
 *     description: Adds a new payment method to the system
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               methodName:
 *                 type: string
 *                 example: 'Credit Card'
 *               details:
 *                 type: string
 *                 example: 'Visa, MasterCard, etc.'
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
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
 * /payment-method/edit/{methodId}:
 *   patch:
 *     summary: Edit an existing payment method
 *     description: Updates the details of an existing payment method
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: methodId
 *         required: true
 *         description: ID of the payment method to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               methodName:
 *                 type: string
 *                 example: 'Updated Method Name'
 *               details:
 *                 type: string
 *                 example: 'Updated details for the payment method'
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /payment-method/all-methods:
 *   get:
 *     summary: Get all payment methods
 *     description: Retrieves a list of all payment methods available
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
