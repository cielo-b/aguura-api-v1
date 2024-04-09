const express = require('express');
const reportController = require('../../controllers/report.controller');
const auth = require('../../middlewares/auth');
const upload = require('../../config/multer');

const router = express.Router();

router.post('/new-report', auth('manageReport'), upload, reportController.newReport);
router.put('/edit-report/:id', auth('manageReport'), upload, reportController.editReport);
router.get('/stats', auth('manageReport'), reportController.reportStats);
router.get('/report-details', auth('manageReport'), reportController.reportDetails);
router.get('/all', auth('manageReport'), reportController.allReports);
router.get('/all/by-category', reportController.allReportsByCategory);
router.get('/counts', auth('manageReport'), reportController.reportCounts);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Report
 *   description: Reports
 */

/**
 * @swagger
 * /report/new-report:
 *   post:
 *     summary: Create new report
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 enum:
 *                   - data
 *                   - research
 *                   - mel
 *                   - analytics
 *                   - ita
 *                   - casestudies
 *                   - agriculture
 *                   - education
 *                   - gesi
 *                   - livelihood
 *                   - publichealth
 *                   - ocd
 *                   - itsupport
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */


/**
 * @swagger
 * /report/stats:
 *   get:
 *     summary: Get stats
 *     description: All reports
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                  $ref: '#/components/schemas/Report'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /report/all:
 *   get:
 *     summary: Get all
 *     description: All reports
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                  $ref: '#/components/schemas/Report'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */