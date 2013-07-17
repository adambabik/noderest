'use strict';

var _        = require('lodash'),
	url      = require('url'),
    Builder  = require('./src/builder'),
    noderest = {};

noderest.auth = {
	OAuth2: 'OAuth2'
};

var defaults = {
	version: null,
	types: ['json']
};

noderest.create = function (config) {
	config || (config = {});
	return new Builder(_.extend({}, defaults, config));
};

noderest.middleware = function (api) {
	if (typeof api !== 'object') {
		throw new Error('You must pass noderest instance as the only argument');
	}

	return function (req, res, next) {
		var reqUrl     = url.parse(req.url, true),
			parts      = reqUrl.pathname.split('/').slice(1),
			params     = _.clone(req.query) || {},
			resources  = api.resources,
			resource   = null,
			i          = 0,
			len        = 0;

		if (parts.length === 0) {
			next();
			return;
		}

		if (api.config.version) {
			parts = parts.slice(1);
		}

		if (!resources.length) {
			next();
			return;
		}

		for (i = 0, len = resources.length; i < len; i++) {
			resource = resources[i];
			if (resource.path.test(req.url)) {
				break;
			}
			resource = null;
		}

		if (!resource) {
			next();
			return;
		}

		if (resource.params) {
			// this loop copies parameters from the route to the params object
			for(i = 0, len = parts.length; i < len; i++) {
				Object.keys(resource.params).forEach(function (key) {
					if (resource.params[key].index + 1 === i) {
						params[key] = parts[i];
					}
				});
			}
		}

		resource.handler.call({ req: req, res: res, next: next }, params, function (err, data) {
			res.end(JSON.stringify(data));
		});
	};
};

module.exports = noderest;
