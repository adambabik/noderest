'use strict';

var Builder    = require('./src/builder'),
	middleware = require('./src/middleware');

var noderest   = {};

noderest.create = function create(config) {
	return new Builder(config);
};

noderest.middleware = middleware;

module.exports = noderest;
