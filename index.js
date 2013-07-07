'use strict';

var _        = require('lodash'),
    Builder  = require('./src/builder'),
    NODEREST = {};

NODEREST.auth = {
  OAuth2: 'OAuth2'
};

var defaults = {
  version: '',
  types: ['json']
};

NODEREST.create = function (config) {
  return new Builder(_.merge({}, defaults, config));
};

module.exports = NODEREST;
