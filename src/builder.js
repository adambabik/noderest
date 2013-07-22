'use strict';

var _        = require('lodash'),
	Resource = require('./resource'),
	a        = require('./assert');

var defaults = {
	version: null,
	basePath: null,
	types: ['json']
};

function Builder(config, pathFragments, resources) {
	var c = this.config = _.extend({}, defaults, config || null);

	/** pathFragments */

	this.pathFragments = [];

	//@TODO: Remove config from basePath
	if (c.basePath) {
		if (c.basePath[0] === '/') {
			c.basePath = c.basePath.slice(1);
		}
		this.pathFragments.push(c.basePath);
	}

	if (c.version) {
		this.pathFragments.push(c.version);
	}

	if (Array.isArray(pathFragments)) {
		this.pathFragments = this.pathFragments.concat(pathFragments);
	}

	/** resources */

	this.resources = [];

	if (Array.isArray(resources)) {
		this.resources = this.resources.concat(resources);
	}
}

Builder.prototype._buildRegExp = function Builder__buildRegExt(pathFragments) {
	pathFragments = ('/' + pathFragments.join('/')).replace(/\//g, '\\/');
	return new RegExp('^' + pathFragments + '$');
};

/**
 * resource
 * @param  {String} path
 * @return {Object} self
 */
Builder.prototype.resource = function Builder_resource(path) {
	a.str(path);

	this.pathFragments.push(path);

	return this;
};

/**
 * getList
 * @param  {Function} handler
 * @return {Object}   self
 */
Builder.prototype.getList = function Builder_getList(handler) {
	a.fun(handler);

	var path = this._buildRegExp(this.pathFragments);
	this.resources.push(new Resource(Resource.Type.LIST, path, null, handler));

	return this;
};

/**
 * get
 * @param {String} path For now, it should be a string that is a fragment of a regex
 * @param {Object} config
 * @param {Function} handler
 */
Builder.prototype.get = function Builder_get(path, config, handler) {
	a.str(path);
	a.fun(handler);

	var self  = this,
		parts = path.split('/').slice(1),
		keys  = path.match(/:\w+/g),
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

		config[key].index = idx + (parts.length - keys.length + 1);

		// assume thta config[key] is a RegExp instance,
		// fix it as it cna be a string as well
		self.pathFragments.push('(' + config[key].re.toString().slice(1, -1) + ')');
	});

	builtPath = this._buildRegExp(this.pathFragments);
	this.resources.push(new Resource(Resource.Type.GET, builtPath, config, handler));

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
	return this;
};

module.exports = Builder;
