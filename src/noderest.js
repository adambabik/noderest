'use strict';

var Builder = require('./builder');

function create(config) {
  return new Builder(config);
}

module.exports = create;
