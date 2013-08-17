'use strict';

var _ = require('lodash');

/**
 * Resource constructor
 *
 * @constructor
 * @param {String}        method HTTP method
 * @param {String|RegExp} pathRe
 * @param {Object}        params Description of what regex match
 * @param {Function}      handler Request handler
 */
function Resource(type, pathRe, params, handler) {
  if (!_.isNumber(type)) {
    throw new Error("'type' must be a number");
  }

  this.type = type;
  this.path = pathRe;
  this.params = params;
  this.handler = handler;
}

/**
 * Detect if HTTP method matches resource type
 *
 * @param {String} method HTTP method
 */
Resource.prototype.matchHttpMethod = function (method) {
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
      throw new Error('Unsupported HTTP method ' + method);
  }
};

Object.defineProperty(Resource.prototype, 'method', {
  get: function () {
    switch (this.type) {
      case Resource.Type.GET:
      case Resource.Type.LIST:
        return 'GET';

      case Resource.Type.SAVE:
        return 'POST';

      case Resource.Type.UPDATE:
        return 'PUT';

      case Resource.Type.DELETE:
        return 'DELETE';
    }
  }
});

Resource.Type = {
  GET    : 0,
  LIST   : 1,
  SAVE   : 2,
  UPDATE : 3,
  DELETE : 4
};

module.exports = Resource;
