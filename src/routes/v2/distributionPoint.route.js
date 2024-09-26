const express = require("express");
const auth = require("../../middlewares/auth");
const { distributionPointController } = require("../../controllers");

const router = express.Router();

router.post("/new", distributionPointController.newDistributionPoint);
router.patch(
  "/edit-point/:distributionPointId",
  auth("distributor"),
  distributionPointController.editDistributionPoint,
);
router.get(
  "/by-manager",
  auth("distributor"),
  distributionPointController.getPointByManager,
);
router.get(
  "/single",
  auth("distributor"),
  distributionPointController.getDistributionPoint,
);
router.get(
  "/stocks",
  auth("distributor"),
  distributionPointController.getStocks,
);
router.get(
  "/all-distributors",
  auth(["distributor", "admin"]),
  distributionPointController.getAllDistributionPoints,
);

module.exports = router;


// Swagger documentation for the Distribution Point routes
/**
 * @swagger
 * tags:
 *   name: DistributionPoint
 *   description: Distribution point management and operations
 */

/**
 * @swagger
 * /distribution-points/new:
 *   post:
 *     summary: Create a new distribution point
 *     description: Adds a new distribution point to the system
 *     tags: [DistributionPoint]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Main Distribution Center'
 *               location:
 *                 type: string
 *                 example: '123 Distribution Ave, City, Country'
 *     responses:
 *       201:
 *         description: Distribution point created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Distribution point created successfully'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /distribution-points/edit-point/{distributionPointId}:
 *   patch:
 *     summary: Edit an existing distribution point
 *     description: Updates the details of a specific distribution point
 *     tags: [DistributionPoint]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: distributionPointId
 *         in: path
 *         required: true
 *         description: ID of the distribution point to edit
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
 *                 example: 'Updated Distribution Center'
 *               location:
 *                 type: string
 *                 example: '456 Updated Ave, City, Country'
 *     responses:
 *       200:
 *         description: Distribution point updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Distribution point updated successfully'
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
 * /distribution-points/by-manager:
 *   get:
 *     summary: Get distribution points by manager
 *     description: Retrieves distribution points associated with the logged-in distributor
 *     tags: [DistributionPoint]
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
 *                 $ref: '#/components/schemas/DistributionPoint'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /distribution-points/single:
 *   get:
 *     summary: Get a single distribution point
 *     description: Retrieves details of a specific distribution point for the logged-in distributor
 *     tags: [DistributionPoint]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DistributionPoint'
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
 * /distribution-points/stocks:
 *   get:
 *     summary: Get stocks for the distribution point
 *     description: Retrieves stock information for the logged-in distributor's distribution point
 *     tags: [DistributionPoint]
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
 *                 $ref: '#/components/schemas/Stock'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /distribution-points/all-distributors:
 *   get:
 *     summary: Get all distribution points
 *     description: Retrieves a list of all distribution points for admin and distributors
 *     tags: [DistributionPoint]
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
 *                 $ref: '#/components/schemas/DistributionPoint'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */