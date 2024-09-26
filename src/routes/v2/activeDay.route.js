const express = require("express");
const auth = require("../../middlewares/auth");
const {activeDayController} = require("../../controllers");

const router = express.Router();

router.get(
  "/active",
  auth(["admin", "distributor", "producer"]),
  activeDayController.getActiveDay,
);
router.get(
  "/all-days",
  auth(["admin", "distributor", "producer"]),
  activeDayController.getActiveDays,
);
router.post(
  "/start",
  auth(["admin", "distributor", "producer"]),
  activeDayController.startDay,
);
router.patch(
  "/end",
  auth(["admin", "distributor", "producer"]),
  activeDayController.endDay,
);
router.get(
  "/download-report",
  auth(["admin", "distributor", "producer"]),
  activeDayController.downloadReport,
);

module.exports = router;


// swagger documetation for the activeDay route
/**
 * @swagger
 * tags:
 *   name: ActiveDay
 *   description: ActiveDay management and retrieval
 */

/**
 * @swagger
 * /active-day/active:
 *   get:
 *     summary: Get active day
 *     description: Get the currently active day
 *     tags: [ActiveDay]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveDay'
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
 * /active-day/all-days:
 *  get:
 *   summary: Get all active days
 *   description: Retrieve a list of all active days
 *   tags: [ActiveDay]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: OK
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/ActiveDay'
 *     401:
 *       description: Unauthorized
 *     403:
 *       description: Forbidden
 *     404:
 *       description: Not Found
 *     500:
 *       description: Internal Server Error
 */

/**
 * @swagger
 * /active-day/start:
 *  post:
 *   summary: Start a new active day
 *   description: Start a new active day by initializing the start time and status
 *   tags: [ActiveDay]
 *   security:
 *     - bearerAuth: []
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             startTime:
 *               type: string
 *               format: date-time
 *               example: '2024-09-25T08:00:00.000Z'
 *   responses:
 *     201:
 *       description: Active day started successfully
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActiveDay'
 *     400:
 *       description: Bad request
 *     401:
 *       description: Unauthorized
 *     403:
 *       description: Forbidden
 *     500:
 *       description: Internal Server Error
 */

/**
 * @swagger
 * /active-day/end:
 *  patch:
 *   summary: End the current active day
 *   description: End the current active day by updating the end time and status
 *   tags: [ActiveDay]
 *   security:
 *     - bearerAuth: []
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             endTime:
 *               type: string
 *               format: date-time
 *               example: '2024-09-25T17:00:00.000Z'
 *   responses:
 *     200:
 *       description: Active day ended successfully
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActiveDay'
 *     400:
 *       description: Bad request
 *     401:
 *       description: Unauthorized
 *     403:
 *       description: Forbidden
 *     500:
 *       description: Internal Server Error
 */

/**
 * @swagger
 * /active-day/download-report:
 *  get:
 *   summary: Download active day report
 *   description: Download a report of the current or previous active days
 *   tags: [ActiveDay]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: query
 *       name: dayId
 *       schema:
 *         type: string
 *       description: ID of the day to generate the report for
 *   responses:
 *     200:
 *       description: Report downloaded successfully
 *       content:
 *         application/octet-stream:
 *           schema:
 *             type: string
 *             format: binary
 *     400:
 *       description: Bad request
 *     401:
 *       description: Unauthorized
 *     403:
 *       description: Forbidden
 *     404:
 *       description: Not Found
 *     500:
 *       description: Internal Server Error
 */
