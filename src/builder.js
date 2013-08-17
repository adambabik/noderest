'use strict';

var _        = require('lodash'),
    Resource = require('./resource'),
    path     = require('path');

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
function Builder(config, pathFragments, params, resources) {
  config || (config = null);

  var c = this.config = _.extend({}, DEFAULTS, config);

  if (c.basePath && c.basePath[0] === '/') {
    c.basePath = c.basePath.slice(1);
  }

  /** pathFragments */
  if (Array.isArray(pathFragments)) {
    this.pathFragments = pathFragments.slice();
  } else {
    this.pathFragments = [];
  }

  // configs for path fragments
  this.params = params || {};

  /** resources */
  this.resources = resources || [];
}

/**
 * Build RegExp object based on provided fragments
 * @private
 * @param {array} pathFragments
 * @return {RegExp}
 */
Builder.prototype.buildRegexp = function (pathFragments, params) {
  var prefixes = [''],
      c        = this.config;

  typeof c.basePath === 'string' && prefixes.push(c.basePath);
  typeof c.version === 'string' && prefixes.push(c.version);

  prefixes.push('');

  // handle params in path

  var p = path.join.apply(path, pathFragments),
      pathIds = p.match(/:\w+/g) || [];

  pathIds.forEach(function (id, index) {
    id = id.slice(1);

    if (!(id in params)) {
      throw new Error("Params do not contain '" + id + "'");
    }

    params[id].index = index;

    p = p.replace(':' + id, '(' + params[id].re.toString().slice(1, -1) + ')');
  });

  var joined = (
    prefixes.join('/') +
    p +
    (c.typeSuffix ? '\\.\\w+' : '') //@TODO: should be more specific regarding the suffix
  ).replace(/\//g, '\\/');

  return new RegExp('^' + joined + '$', 'i');
};

/**
 * Extends this.params by new definitions from config
 * @private
 * @param  {object} config new params
 */
Builder.prototype.extendParams = function (config) {
  var id;

  for (id in config) {
    if (!config.hasOwnProperty(id)) {
      continue;
    }

    if (id in this.params) {
      throw new Error("Param '" + id + "' is duplicated.");
    }

    this.params[id] = {
      re: config[id],
      index: -1
    };
  }
};

Builder.prototype._detailedResource = function (type, path, config, handler) {
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

  this.pathFragments.push(path);
  this.extendParams(config);

  var res = new Resource(
    type,
    this.buildRegexp(this.pathFragments, this.params),
    _.clone(this.params),
    handler
  );

  this.resources.push(res);

  return this;
};

Builder.prototype._simpleResource = function (type, handler) {
  if (!_.isFunction(handler)) {
    throw new Error("'handler' argument must be a function");
  }

  var res = new Resource(
    type,
    this.buildRegexp(this.pathFragments, this.params),
    _.clone(this.params),
    handler
  );

  this.resources.push(res);

  return this;
};

/**
 * Define new resource
 * @param  {string} path
 * @return {object} self
 */
Builder.prototype.resource = function (path) {
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
Builder.prototype.all = _.partial(
  Builder.prototype._simpleResource,
  Resource.Type.LIST
);

/**
 * Create GET resource
 * @param {string} path
 * @param {object} config
 * @param {function} handler
 */
Builder.prototype.get = _.partial(
  Builder.prototype._detailedResource,
  Resource.Type.GET
);

/**
 * Create POST resource
 * @param {function} handler
 */
Builder.prototype.save = _.partial(
  Builder.prototype._simpleResource,
  Resource.Type.SAVE
);

/**
 * Create PUT resource
 * @param {string} path
 * @param {object} config
 * @param {function} handler
 */
Builder.prototype.update = _.partial(
  Builder.prototype._detailedResource,
  Resource.Type.UPDATE
);

/**
 * Create DELETE resource
 * @param {string} path
 * @param {object} config
 * @param {function} handler
 */
Builder.prototype.delete = _.partial(
  Builder.prototype._detailedResource,
  Resource.Type.DELETE
);

/**
 * Create new instance of Builderwith current parh fragments, but empty resources array
 * @return {object} Builder
 */
Builder.prototype.detach = function () {
  return new Builder(
    this.config,
    this.pathFragments,
    _.clone(this.params),
    this.resources
  );
};

/**
 * Work in the same way like detach but remove the last resource before returning.
 * @return {[type]} [description]
 */
Builder.prototype.end = function () {
  var last = _.last(this.pathFragments);
  var lastParams = last.match(/:\w+/g);
  var params = _.clone(this.params);

  if (lastParams) {
    lastParams.forEach(function (p) {
      delete params[p.slice(1)];
    });
  }

  return new Builder(
    this.config,
    this.pathFragments.slice(0, this.pathFragments.length - 1),
    params,
    this.resources
  );
};

/**
 * Return new instance of api, with no resources.
 * @return {[type]} [description]
 */
Builder.prototype.begin = function () {
  return new Builder(this.config, [], {}, this.resources);
};

module.exports = Builder;
