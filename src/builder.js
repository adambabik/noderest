'use strict';

var _        = require('lodash'),
	Resource = require('./resource'),
	a        = require('./assert');

var defaults = {
	version:    null,
	basePath:   null,
	typeSuffix: false,
	types:      ['json']
};

function Builder(config, pathFragments, resources) {
	var c = this.config = _.extend({}, defaults, config || null);

	if (c.basePath && c.basePath[0] === '/') {
		c.basePath = c.basePath.slice(1);
	}

	/** pathFragments */

	this.pathFragments = [];

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
	var prefixes = [''],
		c        = this.config,
		joined;

	if (c.basePath) {
		prefixes.push(c.basePath);
	}

	if (c.version) {
		prefixes.push(c.version);
	}

	prefixes.push('');

	joined = (prefixes.join('/') + pathFragments.join('/') + (c.typeSuffix ? '\\.\\w+' : '')).replace(/\//g, '\\/');
	return new RegExp('^' + joined + '$');
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

Builder.prototype._parsePath = function Builder__parsePath(path, config) {
	var self      = this,
		fragments = [],
		parts     = path.split('/').slice(1),
		keys      = path.match(/:\w+/g),
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
		// fix it as it can be a string as well
		fragments.push('(' + config[key].re.toString().slice(1, -1) + ')');
	});

	return fragments;
};

/**
 * get
 * @param {String} path For now, it should be a string that is a fragment of a regex
 * @param {Object} config
 * @param {Function} handler
 */
Builder.prototype.get = function Builder_get(path, config, handler) {
	if (typeof config === 'function') {
		handler = config;
		config = {};
	} else {
		config || (config = {});
	}

	a.str(path);
	a.fun(handler);

	// add elements to pathFragments
	this.pathFragments = this.pathFragments.concat(this._parsePath(path, config));

	var builtPath = this._buildRegExp(this.pathFragments);
	this.resources.push(new Resource(Resource.Type.GET, builtPath, config, handler));

	return this;
};

Builder.prototype.save = function Builder_save(handler) {
	a.fun(handler);

	var path = this._buildRegExp(this.pathFragments);
	this.resources.push(new Resource(Resource.Type.SAVE, path, null, handler));

	return this;
};

Builder.prototype.update = function Builder_update(path, config, handler) {
	if (typeof config === 'function') {
		handler = config;
		config = {};
	} else {
		config || (config = {});
	}

	a.str(path);
	a.fun(handler);

	// add elements to pathFragments
	this.pathFragments = this.pathFragments.concat(this._parsePath(path, config));

	var builtPath = this._buildRegExp(this.pathFragments);
	this.resources.push(new Resource(Resource.Type.UPDATE, builtPath, config, handler));

	return this;
};

Builder.prototype.delete = function Builder_delete(path, config, handler) {
	if (typeof config === 'function') {
		handler = config;
		config = {};
	} else {
		config || (config = {});
	}

	a.str(path);
	a.fun(handler);

	// add elements to pathFragments
	this.pathFragments = this.pathFragments.concat(this._parsePath(path, config));

	var builtPath = this._buildRegExp(this.pathFragments);
	this.resources.push(new Resource(Resource.Type.DELETE, builtPath, config, handler));

	return this;
};

// Object.defineProperty(Builder.prototype, 'parent', {
// 	get: function () {
// 		return this._parent;
// 	},
// 	set: function (builder) {
// 		if (!(builder instanceof Builder)) {
// 			throw new Error("Parent must be an instance of Builder");
// 		}

// 		this._parent = builder;
// 	}
// });

Builder.prototype.detach = function Builder_detach() {
	var instance = new Builder(this.config, this.pathFragments);
	//instance.parent = this;

	return instance;
};

module.exports = Builder;
