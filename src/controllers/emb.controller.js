const axios = require("axios");
const config = require("../config/config");

const API = axios.create({ baseURL: config.embUrl });

const initialize = async (body) => {
  try {
    const res = await API.post("initializer/selectInitInfo", body);
    return res.data;
  } catch (error) {
    console.error("Error initializing device:", error);
    throw error;
  }
};

const saveItem = async (item) => {
  try {
    const res = await API.post("items/saveItems", item);
    return res.data;
  } catch (error) {
    console.error("Error saving item:", error);
    throw error;
  }
};

const newSale = async (body) => {
  try {
    const res = await API.post("sales/sendSalesTransaction", body);
    return res.data;
  } catch (error) {
    console.error("Error recording sale:", error);
    throw error;
  }
};

const invoice = async (body) => {
  try {
    const res = await API.post("sales/sendSalesInvoice", body);
    return res.data;
  } catch (error) {
    console.error("Error sending invoice:", error);
    throw error;
  }
};

module.exports = {
  initialize,
  saveItem,
  newSale,
  invoice,
};
