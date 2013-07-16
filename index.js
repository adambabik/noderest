'use strict';

var _        = require('lodash'),
	url      = require('url'),
    Builder  = require('./src/builder'),
    noderest = {};

noderest.auth = {
	OAuth2: 'OAuth2'
};

var defaults = {
	version: '',
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
			params = _.clone(req.query),
			resources,
			foundResource,
			i = 0, len = parts.length;

		if (parts.length < 2) {
			next();
			return;
		}

		resources = api.resources[parts[1]];

		if (!resources) {
			next();
			return;
		}

		resources.forEach(function (item) {
			if (!item.path.test(req.url)) {
				return;
			}

			if (foundResource) {
				throw new Error('Matched more than one generated path ' + item.path);
			}

			foundResource = item;
		});

		if (foundResource) {
			for(i = 2, len = parts.length; i < len; i++) {
				Object.keys(foundResource.params).forEach(function (key) {
					if (foundResource.params[key].index + 2 === i) {
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
