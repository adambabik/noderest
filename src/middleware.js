'use strict';

var _        = require('lodash'),
	url      = require('url');

function createContext(req, res, next) {
	return { req: req, res: res, next: next };
}

function urlParts(api, pathname) {
	var parts    = pathname.split('/'),
		sliceIdx = 1; // to remove the empty string from the beginning

	sliceIdx += !!api.config.version;
	sliceIdx += !!api.config.basePath;

	parts = parts.slice(sliceIdx);

	return parts;
}

function findResource(resources, pathname, method) {
	var resource = null,
		i        = 0,
		len      = 0;

	if (!resources.length) {
		return null;
	}

	for (i = 0, len = resources.length; i < len; i++) {
		if (resources[i].path.test(pathname) && resources[i].matchHttpMethod(method)) {
			resource = resources[i];
			break;
		}
	}

	return resource;
}

function parseParams(resource, query, parts) {
	var i      = 0,
		len    = 0,
		params = query && typeof query === 'object' ? _.clone(query) : {};

	if (!resource.params) {
		return params;
	}

	// this loop copies parameters from the route to the params object
	for(i = 0, len = parts.length; i < len; i++) {
		Object.keys(resource.params).forEach(function (key) {
			if (resource.params[key].index === i) {
				params[key] = parts[i];
			}
		});
	}

	return params;
}

function middleware(api) {
	if (typeof api !== 'object') {
		throw new Error('You must pass noderest instance as the only argument');
	}

	return function (req, res, next) {
		var reqUrl     = url.parse(req.url, true),
			parts      = urlParts(api, reqUrl.pathname),
			resources  = api.resources,
			resource   = findResource(resources, reqUrl.pathname, req.method),
			params     = null;

		if (!resource) {
			next();
			return;
		}

		// `req.query` is parsed by connect's middleware
		params = parseParams(resource, req.query, parts);

		resource.handler.call(createContext(req, res, next), params, function (err, data) {
			// set headers
			res.setHeader('Content-Type', 'application/json; charset=utf-8');

			if (err) {
				// make sure the statusCode is not 200
				if (res.statusCode < 400) {
					res.statusCode = 400;
				}

				res.end(JSON.stringify(err));
				return;
			}

			!data && (data = '');
			res.end(JSON.stringify(data));
		});
	};
}

middleware._private = {
	createContext : createContext,
	urlParts      : urlParts,
	findResource  : findResource,
	parseParams   : parseParams
};

module.exports = middleware;
