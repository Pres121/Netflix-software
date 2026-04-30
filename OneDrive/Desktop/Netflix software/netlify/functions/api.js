const express = require('express');
const serverless = require('serverless-http');
const app = require('../../server');

const netlifyApp = express();

netlifyApp.use(app);

module.exports.handler = serverless(netlifyApp);
