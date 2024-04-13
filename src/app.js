const express = require('express');
const helmet = require('helmet');
const path = require('path');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const {jwtStrategy} = require('./config/passport');
const {rateLimiter} = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const {errorConverter, errorHandler} = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

if (config.env !== 'test') {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy: "cross-origin"}));

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({extended: true}));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors for only specific domains
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://stock-frontend-mocha.vercel.app'
    ]
}));

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

//server static images
app.use('/public/reports', express.static(path.join(__dirname, '../public/reports')));


// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
    app.use('/api/v1/', rateLimiter);
}

app.get('/', (req, res) => {
    return res.status(httpStatus.OK).json({
        success: true,
        message: 'Welcome To Stock Backend.'
    });
});

// v1 api routes
app.use('/api/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not Found.'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
