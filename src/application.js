'use strict';

var express = require('express');

var DEFAULT_PORT = 3000;

var app = module.exports = {};

app.init = function init(app, config) {
	app || (app = config || {});

	// config is an express application
	if (app.request && app.response) {
		this.app = app;
	}
	// if it is not, create a new express app
	else {
		config = app;
		this.app = express();
	}

	this.defaultConfiguration(config);

	return this;
};

app.defaultConfiguration = function defaultConfiguration(config) {
	this.app.disable('x-powered-by');

	// @TODO: the rest of configuration
};

app.listen = function listen() {
	var args = Array.prototype.slice.call(arguments);

	if (!args) {
		args.push(DEFAULT_PORT);
	}

	return this.app.listen.apply(this.app, args);
};
