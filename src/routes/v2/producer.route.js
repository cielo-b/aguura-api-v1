const express = require("express");
const auth = require("../../middlewares/auth");
const { producerController } = require("../../controllers");

const router = express.Router();

router.post("/new", producerController.newProducer);
router.patch(
  "/edit-producer/:producerId",
  auth("producer"),
  producerController.editProducer,
);
router.get(
  "/by-manager",
  auth("producer"),
  producerController.getProducerByManager,
);
router.get(
  "/distributors",
  auth("producer"),
  producerController.getDistributors,
);
router.get("/stocks", auth("producer"), producerController.getStocks);
router.get("/customers", auth("producer"), producerController.getCustomers);
router.get(
  "/single",
  auth(["producer", "distributor", "user", "superAdmin"]),
  producerController.getProducer,
);
router.get(
  "/all-producers",
  auth(["distributor", "admin", "user", "superAdmin"]),
  producerController.getAllProducers,
);

module.exports = router;


// Swagger documentation for the Producer routes
/**
 * @swagger
 * tags:
 *   name: Producer
 *   description: Management of producers
 */

/**
 * @swagger
 * /producer/new:
 *   post:
 *     summary: Create a new producer
 *     description: Adds a new producer to the system
 *     tags: [Producer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'New Producer'
 *               details:
 *                 type: string
 *                 example: 'Details about the producer'
 *     responses:
 *       201:
 *         description: Producer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producer'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /producer/edit-producer/{producerId}:
 *   patch:
 *     summary: Edit an existing producer
 *     description: Updates the details of an existing producer
 *     tags: [Producer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: producerId
 *         required: true
 *         description: ID of the producer to edit
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
 *                 example: 'Updated Producer Name'
 *               details:
 *                 type: string
 *                 example: 'Updated details about the producer'
 *     responses:
 *       200:
 *         description: Producer updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Producer not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /producer/by-manager:
 *   get:
 *     summary: Get producers by manager
 *     description: Retrieves producers managed by the authenticated producer
 *     tags: [Producer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of producers managed by the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producer'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /producer/distributors:
 *   get:
 *     summary: Get distributors associated with the producer
 *     description: Retrieves a list of distributors linked to the authenticated producer
 *     tags: [Producer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of distributors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Distributor'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /producer/stocks:
 *   get:
 *     summary: Get stocks for the producer
 *     description: Retrieves stocks available for the authenticated producer
 *     tags: [Producer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stock'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /producer/customers:
 *   get:
 *     summary: Get customers of the producer
 *     description: Retrieves a list of customers linked to the authenticated producer
 *     tags: [Producer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /producer/single:
 *   get:
 *     summary: Get a single producer's details
 *     description: Retrieves the details of a specific producer
 *     tags: [Producer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Producer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producer'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Producer not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /producer/all-producers:
 *   get:
 *     summary: Get all producers
 *     description: Retrieves a list of all producers in the system
 *     tags: [Producer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all producers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producer'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
