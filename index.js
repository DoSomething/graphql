// Enable ES module support in Node.
require = require("@std/esm")(module);

// Load environment variables from '.env'.
require('dotenv').config();

// Register 'fetch' polyfill as a global.
fetch = require('node-fetch');

// Start the server.
module.exports = require("./src/server.js").default;
