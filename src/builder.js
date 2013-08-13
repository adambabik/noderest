'use strict';

var _        = require('lodash'),
    Resource = require('./resource');

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
function Builder(config, pathFragments) {
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
}

/**
 * Build RegExp object based on provided fragments
 * @private
 * @param {array} pathFragments
 */
Builder.prototype.buildRegexp = function (pathFragments) {
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
 * Parse path and match agains provided configuration.
 * @private
 * @param {string} path   pseudo path, like /products/:id
 * @param {object} config configuration object which matches against tokens found in path
 */
Builder.prototype.parsePath = function BuilderparsePath(path, config) {
  var fragments = [],
      parts     = path.split('/').slice(1),
      keys      = path.match(/:\w+/g),
      key;

  for (key in config) {
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

    config[key].index = idx + (parts.length - keys.length);

    // @TODO
    // assume that config[key] is a RegExp object,
    // fix it as it can be a string as well
    fragments.push('(' + config[key].re.toString().slice(1, -1) + ')');
  });

  return fragments;
};

/**
 * Define new resource
 * @param  {string} path
 * @return {object} self
 */
Builder.prototype.resource = function Builder_resource(path) {
  if (!_.isString(path)) {
    throw new Error("'path' argument must be a string");
  }

  this.pathFragments.push(path);
  return this;
};

/**
 * Define GET resource
 * @param  {function} handler
 * @return {object}   self
 */
Builder.prototype.getList = function Builder_getList(handler) {
  if (!_.isFunction(handler)) {
    throw new Error("'handler' argument must be a function");
  }

  var path = this.buildRegexp(this.pathFragments),
      res  = new Resource(Resource.Type.LIST, path, null, handler);

  this.resources.push(res);
  //this.app.get(path, middleware(res));

  return this;
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

  if (!_.isString(path)) {
    throw new Error("'path' argument must be a string");
  }

  if (!_.isFunction(handler)) {
    throw new Error("'handler' argument must be a function");
  }

  this.pathFragments = this.pathFragments.concat(this.parsePath(path, config));

  var rePath = this.buildRegexp(this.pathFragments),
      res    = new Resource(Resource.Type.GET, rePath, config, handler);

  this.resources.push(res);
  //this.app.get(rePath, middleware(res));

  return this;
};

/**
 * Create POST resource
 * @param {function} handler
 */
Builder.prototype.save = function Builder_save(handler) {
  if (!_.isFunction(handler)) {
    throw new Error("'handler' argument must be a function");
  }

  var path = this.buildRegexp(this.pathFragments),
      res  = new Resource(Resource.Type.SAVE, path, null, handler);

  this.resources.push(res);
  //this.app.get(path, middleware(res));

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

  if (!_.isString(path)) {
    throw new Error("'path' argument must be a string");
  }

  if (!_.isFunction(handler)) {
    throw new Error("'handler' argument must be a function");
  }

  this.pathFragments = this.pathFragments.concat(this.parsePath(path, config));

  var rePath = this.buildRegexp(this.pathFragments),
      res    = new Resource(Resource.Type.UPDATE, rePath, config, handler);

  this.resources.push(res);
  //this.app.put(rePath, middleware(res));

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

  if (!_.isString(path)) {
    throw new Error("'path' argument must be a string");
  }

  if (!_.isFunction(handler)) {
    throw new Error("'handler' argument must be a function");
  }

  this.pathFragments = this.pathFragments.concat(this.parsePath(path, config));

  var rePath = this.buildRegexp(this.pathFragments),
      res    = new Resource(Resource.Type.DELETE, rePath, config, handler);

  this.resources.push(res);
  //this.app.del(rePath, middleware(res));

  return this;
};

/**
 * Create new instance of Builderwith current parh fragments, but empty resources array
 *
 * @return {object} Builder
 */
Builder.prototype.detach = function Builder_detach() {
  return new Builder(this.config, this.pathFragments);
};

module.exports = Builder;
