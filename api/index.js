// api/index.js
const app = require("../server"); // import the Express app

module.exports = (req, res) => {
  app(req, res); // delegate request handling to Express
};
