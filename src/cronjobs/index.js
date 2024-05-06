const clearTokens = require('./clearTokens.cronjob');
const logger = require('../config/logger')

const clonJobsHandler = () => {
    logger.info('Cron Jobs Started.');
    clearTokens.start();
};

module.exports = clonJobsHandler