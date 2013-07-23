'use strict';

var _        = require('lodash'),
	Resource = require('./resource'),
	a        = require('./assert');

var DEFAULTS = {
	version:    null,
	basePath:   null,
	typeSuffix: false,
	types:      ['json']
};

/**
 * Builder
 * @constructor
 * @param {object} config
 * @param {[array]} pathFragments
 * @param {[array]} resources
 */
function Builder(config, pathFragments, resources) {
	config || (config = null);

	var c = this.config = _.extend({}, DEFAULTS, config);

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

/**
 * Build RegExp object based on provided fragments
 * @private
 * @param {array} pathFragments
 */
Builder.prototype._buildRegExp = function Builder__buildRegExp(pathFragments) {
	var prefixes = [''],
		c        = this.config,
		joined;

	typeof c.basePath === 'string' && prefixes.push(c.basePath);
	typeof c.version === 'string' && prefixes.push(c.version);

	prefixes.push('');

	joined = (
		prefixes.join('/') +
		pathFragments.join('/') +
		(c.typeSuffix ? '\\.\\w+' : '')
	).replace(/\//g, '\\/');

	return new RegExp('^' + joined + '$', 'i');
};

/**
 * Define new resource
 * @param  {string} path
 * @return {object} self
 */
Builder.prototype.resource = function Builder_resource(path) {
	a.str(path);
	this.pathFragments.push(path);
	return this;
};

/**
 * Define GET resource
 * @param  {function} handler
 * @return {object}   self
 */
Builder.prototype.getList = function Builder_getList(handler) {
	a.fun(handler);

	var path = this._buildRegExp(this.pathFragments);
	this.resources.push(new Resource(Resource.Type.LIST, path, null, handler));

	return this;
};

/**
 * Parse path and match agains provided configuration.
 * @private
 * @param {string} path   pseudo path, like /products/:id
 * @param {object} config configuration object which matches against tokens found in path
 */
Builder.prototype._parsePath = function Builder__parsePath(path, config) {
	var fragments = [],
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
			throw new Error("Config does not contain " + key);
		}

		config[key].index = idx + (parts.length - keys.length + 1);

		// assume thta config[key] is a RegExp instance,
		// fix it as it can be a string as well
		fragments.push('(' + config[key].re.toString().slice(1, -1) + ')');
	});

	return fragments;
};

/**
 * Create GET resource
 * @param {string} path
 * @param {object} config
 * @param {function} handler
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

	this.resources.push(
		new Resource(
			Resource.Type.GET,
			this._buildRegExp(this.pathFragments),
			config,
			handler
		)
	);

	return this;
};

/**
 * Create POST resource
 * @param {function} handler
 */
Builder.prototype.save = function Builder_save(handler) {
	a.fun(handler);

	this.resources.push(
		new Resource(
			Resource.Type.SAVE,
			this._buildRegExp(this.pathFragments),
			null,
			handler
		)
	);

	return this;
};

/**
 * Create PUT resource
 * @param {string} path
 * @param {object} config
 * @param {function} handler
 */
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

	this.resources.push(
		new Resource(
			Resource.Type.UPDATE,
			this._buildRegExp(this.pathFragments),
			config,
			handler
		)
	);

	return this;
};

/**
 * Create DELETE resource
 * @param {string} path
 * @param {object} config
 * @param {function} handler
 */
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

	this.resources.push(
		new Resource(
			Resource.Type.DELETE,
			this._buildRegExp(this.pathFragments),
			config,
			handler
		)
	);

	return this;
};

/**
 * Create new instance of Builderwith current parh fragments, but empty resources array
 * @return {object} Builder
 */
Builder.prototype.detach = function Builder_detach() {
	return new Builder(this.config, this.pathFragments);
};

module.exports = Builder;
