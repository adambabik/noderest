'use strict';

var Builder    = require('./src/builder'),
	middleware = require('./src/middleware');

var noderest = module.exports = {};

noderest.create = function create(config) {
	return new Builder(config);
};

noderest.setup = middleware.setup;

