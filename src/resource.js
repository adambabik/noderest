'use strict';

var a = require('./assert');

/**
 * Resource constructor
 * @constructor
 * @param {String}        method HTTP method
 * @param {String|RegExp} path
 * @param {Object}        params Description of what regex match
 * @param {Function}      handler Request handler
 */
function Resource(type, path, params, handler) {
	a.num(type);

	this.type = type;
	this.path = path;
	this.params = params;
	this.handler = handler;
}

Resource.Type = {
	GET    : 0,
	LIST   : 1,
	SAVE   : 2,
	UPDATE : 3,
	DELETE : 4
};

module.exports = Resource;
