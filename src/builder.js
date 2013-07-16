'use strict';

var _ = require('lodash');

function assertString(arg) {
	if (typeof arg !== 'string' || arg === '') {
		throw new Error("Argument must be a string");
	}
}

function assertFunction(arg) {
	if (typeof arg !== 'function') {
		throw new Error("Argument must be a function");
	}
}

function assertNumber(arg) {
	if (typeof arg !== 'number') {
		throw new Error("Argument must be a number");
	}
}

function createContext(req, res, next) {
	return { req: req, res: res, next: next };
}

/**
 * Resource constructor
 * @constructor
 * @param {String}        method HTTP method
 * @param {String|RegExp} path
 * @param {Object}        params Description of what regex match
 * @param {Function}      handler Request handler
 */
function Resource(type, path, params, handler) {
	assertNumber(type);

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

function Builder(config) {
	config || (config = {});

	this.config = config;

	// current path fragments which are used to create `path` instance variable in Resource instances
	// @TODO: information about API version should be included
	this.pathFragments = [''];

	// named resources created by `resource` method
	this.resources = {};
	this.currentResource = null;
}

Builder.Resource = Resource;

Builder.prototype._buildRegExp = function Builder__buildRegExt(pathFragments) {
	var c = this.config;
	return new RegExp('^' + (c.version ? '\\/' + c.version : '') + pathFragments + '(\\?.*)?$');
};

/**
 * resource
 * @param  {String} path
 * @return {Object} self
 */
Builder.prototype.resource = function Builder_resource(path) {
	assertString(path);

	this.pathFragments.push(path);
	this.currentResource = this.resources[path] = [];

	return this;
};

/**
 * getList
 * @param  {Function} handler
 * @return {Object}   self
 */
Builder.prototype.getList = function Builder_getList(handler) {
	assertFunction(handler);

	var pathFragments = this.pathFragments.join('/').replace(/\//g, '\\/'),
		path = this._buildRegExp(pathFragments);

	this.currentResource.push(new Resource(Resource.Type.LIST, path, null, handler));

	return this;
};

/**
 * get
 * @param {String} path For now, it should be a string that is a fragment of a regex
 * @param {Object} config
 * @param {Function} handler
 */
Builder.prototype.get = function Builder_get(path, config, handler) {
	assertString(path);
	assertFunction(handler);

	var self = this,
		keys = path.match(/:\w+/g),
		pathFragments,
		builtPath,
		key;

	for(key in config) {
		if (!config.hasOwnProperty(key)) {
			continue;
		}

		config[key] = {
			re: config[key],
			index: null
		};
	}

	keys.forEach(function (key, idx) {
		key = key.slice(1);

		if (!(key in config)) {
			throw new Error('Config does not contain ' + key);
		}

		config[key].index = idx;

		// assume thta config[key] is a RegExp instance,
		// fix it as it cna be a string as well
		self.pathFragments.push('(' + config[key].re.toString().slice(1, -1) + ')');
	});

	pathFragments = this.pathFragments.join('/').replace(/\//g, '\\/');
	builtPath = this._buildRegExp(pathFragments);

	this.currentResource.push(new Resource(Resource.Type.GET, builtPath, config, handler));

	return this;
};

Builder.prototype.save = function Builder_save(handler) {
	this.currentNode.handlers.POST = {
		handler: handler
	};
};

Builder.prototype.update = function Builder_update(path, config, handler) {
	if (typeof config === 'function') {
		handler = config;
		config = {};
	}

	this.currentNode.handlers.PUT = {
		handler: handler,
		path: path,
		config: config
	};
};

Builder.prototype.delete = function Builder_delete(path, config, handler) {
	if (typeof config === 'function') {
		handler = config;
		config = {};
	}

	this.currentNode.handlers.DELETE = {
		handler: handler,
		path: path,
		config: config
	};
};

Builder.prototype.to = function Builder_to(path) {

};

module.exports = Builder;
