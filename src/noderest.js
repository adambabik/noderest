'use strict';

var Builder = require('./builder'),
    middleware = require('./middleware');

function create(config) {
  return new Builder(config);
}

create.middleware = middleware;

module.exports = create;
