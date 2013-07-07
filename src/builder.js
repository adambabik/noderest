'use strict';

var _ = require('_');

function Node(parent, path) {
	this.parent = parent;
	this.path = path;
	this.handlers = {};
}

function assertString(arg) {
	if (typeof arg !== 'string' || arg === '') {
		throw new Error("Argument must be a string");
	}
}

function createContext(req, res, next) {
	return { req: req, res: res, next: next };
}

function parseUrlParams(params) {
	assertString(params);

}

function Builder(config) {
	config || (config = {});

	this.resources = [];
	this.currentNode = null;
}

var proto = Builder.prototype;

proto.resource = function (path) {
	assertString(path);
	var node = createNode(null, path);
	this.resources.push(node);
	this.currentNode = node;
};

/**
 * getListDone
 * @param  {object}   req  request object
 * @param  {object}   res  response object
 * @param  {Function} next
 * @param  {object}   err  error data
 * @param  {object}   data return data
 */
function getListDone(req, res, next, err, data) {
	if (err) {
		res.setStatus(400).end(err);
	} else if (!data) {
		res.setStatus(204).end();
	} else {
		res.end(data);
	}
}

proto.getList = function (handler) {
	var token = _.last(this.tokens);

	token.handlers.GET = function (req, res, next) {
		handler.call(
			createContext(req, res, next),
			req.query,
			getListDone.bind(null, req, res, next)
		);
	};
};

proto.get = function (params, path) {
	params = parseUrlParams(params);
};

module.exports = Builder;
