/*global describe: false, it: false, beforeEach: false */

'use strict';

/** Creating noderest instance */

var noderest = require('../index'),
	myAPI    = noderest.create({});

myAPI.
	resource('products').
	getList(function (params, done) {
		var tab = [],
			limit = params.limit || 20;

		for(var i = 0; i < limit; i++) {
			tab.push({
				id: i,
				name: 'Product #' + i
			});
		}

		done(null, tab);
	}).
	get('/:id', { id: /\d+/ }, function (params, done) {
		done(null, { id: parseInt(params.id, 10), name: 'Product #' + params.id, param: params.param });
	});

var connect = require('connect'),
	http    = require('http'),
	app     = connect();

app
	.use(connect.bodyParser())
	.use(connect.query())
	.use(noderest.middleware(myAPI));

http.createServer(app).listen(3123);

/** Start tests */

var expect  = require('chai').expect;

describe('noderest', function () {
	describe('#getList()', function () {
		it('without parameters', function (done) {
			http.request({
				port: 3123,
				path: '/products'
			}, function (res) {
				var buf = '';

				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					var obj = JSON.parse(buf);

					expect(res.statusCode).to.equal(200);
					expect(obj).to.have.length(20);

					done();
				});
			}).end();
		});

		// wrote listening to http://www.youtube.com/watch?v=guJ25FxCwmY

		it('with parameters', function (done) {
			http.request({
				port: 3123,
				path: '/products?limit=10'
			}, function (res) {
				var buf = '';

				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					var obj = JSON.parse(buf);

					expect(res.statusCode).to.equal(200);
					expect(obj).to.have.length(10);

					done();
				});
			}).end();
		});
	});

	describe('#get()', function () {
		it('without parameters', function (done) {
			http.request({
				port: 3123,
				path: '/products/1'
			}, function (res) {
				var buf = '';

				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					var obj = JSON.parse(buf);

					expect(res.statusCode).to.equal(200);
					expect(obj.id).to.equal(1);

					done();
				});
			}).end();
		});

		it('with parameters', function (done) {
			http.request({
				port: 3123,
				path: '/products/1?param=true'
			}, function (res) {
				var buf = '';

				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					var obj = JSON.parse(buf);

					expect(res.statusCode).to.equal(200);
					expect(obj.id).to.equal(1);
					expect(obj.param).to.equal('true');

					done();
				});
			}).end();
		});
	});

	// the tests would follow such a scenario:
	// 1. Create a http.ClientRequest to localhost:3123 with specific method, URL and params,
	// 2. Examine the response as the only result as it's supposed to be a high level test.
});
