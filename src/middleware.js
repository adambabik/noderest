'use strict';

var a    = require('./assert'),
	_    = require('lodash'),
	req_ = require('./request'),
	res_ = require('./response');

var mid = module.exports = {};

mid.parseUrl = function parseUrl(pathname, api) {
	var parts  = pathname.split('/').slice(1),
		result = { rest: parts };

	if (api.config.basePath) {
		result.basePath = parts.shift();
	}

	if (api.config.version) {
		result.version = parts.shift();
	}

	return result;
};

mid.parseParams = function parseParams(resource, query, parts) {
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
};

mid.createContext = function createContext(req, res, next) {
	return { req: req, res: res, next: next };
};

mid.respond = function respond(api, req, res) {
	var resource = api.findResource(req.path, req.method),
		parts    = this.parseUrl(req.path, api),
		context  = this.createContext(req, res),
		params;

	if (!resource) {
		return false;
	}

	params = this.parseParams(resource, req.query, parts.rest);

	resource.handler.call(context, params, function (err, data) {
		res.json(err || data);
	});
};

mid.setup = function setup(api) {
	a.obj(api);

	var orig = {},
		self = this;

	return function noderest(req, res, next) {
		orig.req = req.__proto__;
		orig.res = res.__proto__;
		req.__proto__ = req_;
		res.__proto__ = res_;

		if (self.respond(api, req, res) === false) {
			req.__proto__ = orig.req;
			res.__proto__ = orig.res;

			next();
		}
	};
};
