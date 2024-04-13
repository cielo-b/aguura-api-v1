const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info('Connected To MongoDB.');
    server = app.listen(config.port, () => {
        logger.info(`Listening To Port ${config.port}.`);
    });
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server Closed.');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM Received.');
    if (server) {
        server.close();
    }
});
