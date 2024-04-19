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
const paymentRoute = require('./payment.route');
const paymentMethodRoute = require('./paymentMethod.route');
const stockRoute = require('./stock.route');
const expenseRoute = require('./expense.route');

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
        path: '/payment-method',
        route: paymentMethodRoute,
    },
    {
        path: '/payment',
        route: paymentRoute,
    },
    {
        path: '/stock',
        route: stockRoute,
    },
    {
        path: '/expense',
        route: expenseRoute,
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
