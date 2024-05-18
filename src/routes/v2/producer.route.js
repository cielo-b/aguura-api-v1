const express = require('express');
const auth = require('../../middlewares/auth');
const {producerController} = require('../../controllers');

const router = express.Router();

router.post('/new', producerController.newProducer);
router.patch('/edit-producer/:producerId', auth('producer'), producerController.editProducer);
router.get('/by-manager', auth('producer'), producerController.getProducerByManager);
router.get('/distributors', auth('producer'), producerController.getDistributors);
router.get('/stocks', auth('producer'), producerController.getStocks);
router.get('/customers', auth('producer'), producerController.getCustomers);
router.get('/single', auth(['producer', 'distributor', 'user', 'superAdmin']), producerController.getProducer);
router.get('/all-producers', auth(['distributor', 'admin', 'user', 'superAdmin']), producerController.getAllProducers);

module.exports = router;