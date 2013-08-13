'use strict';

var _ = require('lodash');

function createContext(req, res, next) {
	return { req: req, res: res, next: next };
}

function getParams(resParams, req) {
	if (!resParams) {
		return _.extend({}, req.query, req.params);
	}

	var params = _.extend({}, req.query),
		keys   = Object.keys(resParams),
		len    = keys.length;

	req.params.forEach(function (param, idx) {
		var key;
		for (var i = 0; i < len; i++) {
			key = keys[i];

			if (resParams[key].index === idx) {
				params[key] = param;
				break;
			}
		}
	});

	return params;
}

function handler(resource) {
	return function (req, res, next) {
		resource.handler.call(
			createContext(req, res, next),
			getParams(resource.params, req),
			function (err, data) {
				if (err) {
					if (res.statusCode < 300) {
						res.status(400);
					}
				}

				res.send(err || data);
			}
		);
	};
}

module.exports = handler;
