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
	return new Builder(_.merge({}, defaults, config));
};

noderest.middleware = function (api) {
	if (typeof api !== 'object') {
		throw new Error('You must pass noderest instance as the only argument');
	}

	return function (req, res, next) {
		var reqUrl = url.parse(req.url, true),
			parts  = reqUrl.pathname.split('/'),
			params = _.clone(req.query) || {},
			resources,
			foundResource,
			i = 0, len = parts.length;

		parts = parts.slice(api.config.version ? 2 : 1);

		if (parts.length === 0) {
			next();
			return;
		}

		resources = api.resources[parts[0]];

		if (!resources) {
			next();
			return;
		}

		resources.forEach(function (item) {
			if (!item.path.test(req.url)) {
				return;
			}

			// already found matching url, throw error
			if (foundResource) {
				throw new Error('Matched more than one generated path ' + item.path + '. Previous ' + foundResource.path);
			}

			foundResource = item;
		});

		if (foundResource) {
			// start from 1 because under 0 is a resource name
			// this loop copies parameters from the route to the params object
			for(i = 1, len = parts.length; i < len; i++) {
				Object.keys(foundResource.params).forEach(function (key) {
					if (foundResource.params[key].index + 1 === i) {
						params[key] = parts[i];
					}
				});
			}

			foundResource.handler.call({ req: req, res: res, next: next }, params, function (err, data) {
				res.end(JSON.stringify(data));
			});
		} else {
			next();
		}
	};
};

module.exports = noderest;
