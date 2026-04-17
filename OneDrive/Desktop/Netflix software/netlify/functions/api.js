const express = require('express');
const serverless = require('serverless-http');
const app = require('../../server');

const netlifyApp = express();

netlifyApp.use((req, res, next) => {
	if (!req.url.startsWith('/api')) {
		req.url = `/api${req.url === '/' ? '' : req.url}`;
	}

	next();
});

netlifyApp.use(app);

module.exports.handler = serverless(netlifyApp);
