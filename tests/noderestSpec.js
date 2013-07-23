/*global describe: false, it: false, before: false */

'use strict';

var noderest = require('../index');

/** API */

var api = noderest.create({ version: '1.0', basePath: 'api' });

var products = api.resource('products').detach();
var cars = products.resource('cars').detach();

api.getList(function (params, done) {
	var tab = [], limit = parseInt(params.limit, 10) || 20;
	for(var i = 0; i < limit; i++) {
		tab.push({ id: i, name: 'Product #' + i });
	}
	done(null, tab);
}).get('/:id', { id: /\d+/ }, function (params, done) {
	done(null, { id: params.id });
});

var carsRes = cars
	.getList(function (params, done) {
		done(null, [{ id: 1, name: 'Volvo' }, { id: 2, name: 'Opel' }]);
	})
	.get('/:name', { name: /\w+/ }, function (params, done) {
		done(null, { id: 1, name: params.name });
	});

/** Server */

var connect = require('connect'),
	http    = require('http'),
	app     = connect();

app
	.use(connect.bodyParser())
	.use(connect.query())
	.use(noderest.middleware(api))
	.use(noderest.middleware(carsRes));

http.createServer(app).listen(3123);

/** Tests */

var expect = require('chai').expect;

describe('overall', function () {
	it('necessary headers', function (done) {
		http.request({
			port: 3123,
			path: '/api/1.0/products'
		}, function (res) {
			var buf = '';
			res.on('data', function (chunk) { buf += chunk; });
			res.on('end', function () {
				var obj = JSON.parse(buf);

				expect(res.statusCode).to.equal(200);
				expect(res.headers).to.have.property('content-type', 'application/json; charset=utf-8');

				done();
			});
		}).end();
	});

	it('#getList()', function (done) {
		var doneCounter = 3;

		http.request({
			port: 3123,
			path: '/api/1.0/products'
		}, function (res) {
			var buf = '';
			res.on('data', function (chunk) { buf += chunk; });
			res.on('end', function () {
				var obj = JSON.parse(buf);

				expect(res.statusCode).to.equal(200);
				expect(obj).to.have.length(20);

				!--doneCounter && done();
			});
		}).end();

		/** With limit */

		http.request({
			port: 3123,
			path: '/api/1.0/products?limit=10'
		}, function (res) {
			var buf = '';
			res.on('data', function (chunk) { buf += chunk; });
			res.on('end', function () {
				var obj = JSON.parse(buf);

				expect(res.statusCode).to.equal(200);
				expect(obj).to.have.length(10);

				!--doneCounter && done();
			});
		}).end();

		/** Nested */

		http.request({
			port: 3123,
			path: '/api/1.0/products/cars'
		}, function (res) {
			var buf = '';
			res.on('data', function (chunk) { buf += chunk; });
			res.on('end', function () {
				var obj = JSON.parse(buf);

				expect(res.statusCode).to.equal(200);
				expect(obj).to.have.length(2);

				!--doneCounter && done();
			});
		}).end();
	});

	it('#get()', function (done) {
		var doneCounter = 1;

		http.request({
			port: 3123,
			path: '/api/1.0/products/1'
		}, function (res) {
			var buf = '';
			res.on('data', function (chunk) { buf += chunk; });
			res.on('end', function () {
				var obj = JSON.parse(buf);

				expect(res.statusCode).to.equal(200);
				expect(obj).to.be.an('object');
				expect(obj).to.have.property('id', '1');

				!--doneCounter && done();
			});
		}).end();
	});
});
