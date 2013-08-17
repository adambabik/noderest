/*global describe: false, it: false, beforeEach: false */

'use strict';

var noderest = require('../index'),
    middleware = require('../src/middleware');

var expect = require('chai').expect;

describe('middleware', function () {
  var api;

  beforeEach(function () {
    api = noderest({
      basePath: 'api',
      version: '1.0'
    });
  });

  it('#getParams()', function () {
    api.resource('products').get('/:id', { id: /\d+/ }, function (params, done) {
      done(null, { id: params.id });
    });

    var params = middleware._getParams(api.resources[0], {
      url: 'http://example.com/api/1.0/products/1'
    });

    expect(params).to.have.property('id', '1');

    api.resource('images').all(function (params, done) {
      done(null, []);
    });

    params = middleware._getParams(api.resources[1], {
      url: 'http://example.com/api/1.0/products/1/images?limit=10'
    });

    expect(params).to.have.property('id', '1');
    expect(params).to.have.property('limit', '10');

    api.get('/:name', { name: /\w+/ }, function (params, done) {
      done(null, { name: params.name });
    });

    params = middleware._getParams(api.resources[2], {
      url: 'http://example.com/api/1.0/products/1/images/test?limit=10'
    });

    expect(params).to.have.property('id', '1');
    expect(params).to.have.property('name', 'test');
    expect(params).to.have.property('limit', '10');
  });

  it('#findResource()', function () {
    api.resource('products').get('/:id', { id: /\d+/ }, function (params, done) {
      done(null, { id: params.id });
    });

    expect(
      middleware._findResource(api.resources, { url: '/api/1.0/products/1' })
    ).to.equal(api.resources[0]);

    api.end().resource('cars').all(function (done) {
      done(null, []);
    });

    expect(middleware._findResource(api.resources, { url: '/api/1.0/products/cars' }))
      .to.equal(api.resources[1]);
  });
});

