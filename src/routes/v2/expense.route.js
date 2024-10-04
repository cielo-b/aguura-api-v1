const express = require("express");
const auth = require("../../middlewares/auth");
const { expenseController } = require("../../controllers");

const router = express.Router();

router.post(
  "/new",
  auth(["admin", "producer", "distributor"]),
  expenseController.newExpense,
);
router.patch(
  "/edit",
  auth(["admin", "producer", "distributor"]),
  expenseController.editExpense,
);
router.get(
  "/daily-expenses",
  auth(["admin", "producer", "distributor"]),
  expenseController.dailyExpenses,
);
router.get(
  "/all-expenses",
  auth(["admin", "producer", "distributor"]),
  expenseController.allExpenses,
);

module.exports = router;

// Swagger documentation for the Expense routes
/**
 * @swagger
 * tags:
 *   name: Expense
 *   description: Management of expenses
 */

/**
 * @swagger
 * /expense/new:
 *   post:
 *     summary: Create a new expense
 *     description: Adds a new expense to the system
 *     tags: [Expense]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 150.50
 *               description:
 *                 type: string
 *                 example: 'Office supplies'
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-09-25T08:00:00.000Z'
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Expense created successfully'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /expense/edit:
 *   patch:
 *     summary: Edit an existing expense
 *     description: Updates the details of a specific expense
 *     tags: [Expense]
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
 *               amount:
 *                 type: number
 *                 example: 200.00
 *               description:
 *                 type: string
 *                 example: 'Updated office supplies'
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-09-26T08:00:00.000Z'
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Expense updated successfully'
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
 * /expense/daily-expenses:
 *   get:
 *     summary: Get daily expenses
 *     description: Retrieves a list of expenses for the current day
 *     tags: [Expense]
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
 *                 $ref: '#/components/schemas/Expense'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /expense/all-expenses:
 *   get:
 *     summary: Get all expenses
 *     description: Retrieves a list of all expenses
 *     tags: [Expense]
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
 *                 $ref: '#/components/schemas/Expense'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
