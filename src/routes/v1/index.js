const express = require('express');

const authRoute = require('./auth.route');
const reportRoute = require('./report.route');
const docsRoute = require('./docs.route');

const router = express.Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute,
    },
    {
        path: '/report',
        route: reportRoute,
    },
    {
        path: '/docs',
        route: docsRoute,
    },
];


defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});


module.exports = router;
