const express = require('express');

const authRoute = require('./auth.route');
const activeDayRoute = require('./activeDay.route');
const creditRoute = require('./credit.route');
const inventoryRoute = require('./inventory.route');
const inventoryProductRoute = require('./inventoryProduct.route');
const orderRoute = require('./order.route');
const salesRoute = require('./sales.route');
const salesProductRoute = require('./salesProduct.route');
const cratesRoute = require('./crates.route');

const docsRoute = require('./docs.route');

const router = express.Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute,
    },
    {
        path: '/active-day',
        route: activeDayRoute,
    },
    {
        path: '/credit',
        route: creditRoute,
    },
    {
        path: '/inventory',
        route: inventoryRoute,
    },
    {
        path: '/inventory-product',
        route: inventoryProductRoute,
    },
    {
        path: '/order',
        route: orderRoute,
    },
    {
        path: '/sales',
        route: salesRoute,
    },
    {
        path: '/sales-product',
        route: salesProductRoute,
    },
    {
        path: '/crates',
        route: cratesRoute,
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
