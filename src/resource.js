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

Resource.prototype.matchHttpMethod = function Resource_matchHttpMethod(method) {
	switch (method) {
		case 'GET':
			return this.type === Resource.Type.GET || this.type === Resource.Type.LIST;

		case 'POST':
			return this.type === Resource.Type.SAVE;

		case 'PUT':
			return this.type === Resource.Type.UPDATE;

		case 'DELETE':
			return this.type === Resource.Type.DELETE;

		default:
			throw new Error('Uknown HTTP method ' + method);
	}
};

Resource.Type = {
	GET    : 0,
	LIST   : 1,
	SAVE   : 2,
	UPDATE : 3,
	DELETE : 4
};

module.exports = Resource;
