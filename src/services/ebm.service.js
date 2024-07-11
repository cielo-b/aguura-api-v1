const axios = require('axios');

const config = require('../config/config');

const API = axios.create({baseURL: config.ebmUrl});

// connect to ebm
const initialize = async (data) => {
    const response = await API.post(`/initializer/selectInitInfo`, data);
    return response.data;
};

// select items from stock
const selectItems = async (data) => {
    const response = await API.post(`/items/selectItems`, data);
    return response.data;
};

// save new items
const saveItems = async (data) => {
    const response = await API.post(`/items/saveItems`, data);
    return response.data;
};

// Save stock items before and after sale/purchase transaction 
const saveStockItems = async (data) => {
    const response = await API.post(`/stock/saveStockItems`, data);
    return response.data;
};

// handle stock quantity
const stockItemsMaster = async (data) => {
    const response = await API.post(`/stockMaster/saveStockMaster`, data);
    return response.data;
};

// handle sales
const saveSales = async (data) => {
    const response = await API.post(`/trnsSales/saveSales`, data);
    return response.data;
};




// Generate Custom Date
const customReqDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Generate item code
const generateItemCode = (entityType, countryCode, productType, number) => {
    const pkgUnitCd = entityType === 'drinks' ? 'BC' : 'BE';
    const qtyUnitCd = entityType === 'drinks' ? 'CMT' : 'MGM';
    const itemCd = `${countryCode}${productType}${pkgUnitCd}${qtyUnitCd}${number}`;

    return {
        pkgUnitCd,
        qtyUnitCd,
        itemCd
    };
};

module.exports = {
    initialize,
    selectItems,
    saveItems,
    saveStockItems,
    saveSales,
    stockItemsMaster,

    customReqDate,
    generateItemCode
};