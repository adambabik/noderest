'use strict';

var _ = require('lodash'),
		url = require('url');

function createContext(req, res, next) {
	return { req: req, res: res, next: next };
}

function getParams(resource, req) {
	var u = url.parse(req.url, true),
			params = _.extend({}, u.query);

	if (!resource.params) {
		return params;
	}

	var pathParams = resource.path.exec(u.pathname).slice(1), // remove the whole pathname
			key, rp;

	for (key in resource.params) {
		if (!resource.params.hasOwnProperty(key)) {
			continue;
		}

		rp = resource.params[key];

		if (!pathParams[rp.index]) {
			throw new Error("Missing '" + key + "' param in pathname " + u.pathname);
		} else {
			params[key] = pathParams[rp.index];
		}
	}

	return params;
}

function findResource(resources, req) {
	var resource = null;

	resources.some(function (res) {
		if (res.path.test(req.url)) {
			resource = res;
			return true;
		}

		return false;
	});

	return resource;
}

function middleware(resources) {
	return function (req, res, next) {
		var resource = findResource(resources, req);

		if (!resource) {
			next();
		}

		resource.handler.call(
			createContext(req, res, next),
			getParams(resource, req),
			function (err, data) {
				if (err) {
					if (res.statusCode < 400) {
						res.statusCode = 400;
					}
				}

				// middleware in the express app
				if (res.send) {
					res.send(err || data);
				} else {
					// @TODO: set up some strategy to decide what serializer should be used
					res.end(JSON.stringify(err || data));
				}
			}
		);
	};
}

middleware._getParams = getParams;
middleware._findResource = findResource;

module.exports = middleware;
