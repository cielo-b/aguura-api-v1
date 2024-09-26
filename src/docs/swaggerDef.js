const { version } = require("../../package.json");
const config = require("../config/config");

const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: "Aguura APIs documentation",
    version,
    license: {
      name: "MIT",
      url: "https://github.com/hagopj13/node-express-boilerplate/blob/master/LICENSE",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/v2`,
    },
    {
      url: `https://apis.aguura.com/api/v2`,
    },
  ],
};

module.exports = swaggerDef;
