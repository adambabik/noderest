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
			tab.push({ id: i, name: 'Product #' + i });
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
	describe('configuration', function () {
		it('should handle version in the path', function (done) {
			var versionedAPI = noderest.create({ version: '1.0' });

			versionedAPI
				.resource('books')
				.get('/:id', { id: /\d+/ }, function (params, done) {
					done(null, { id: parseInt(params.id, 10) });
				});

			app.use(noderest.middleware(versionedAPI));

			http.request({
				port: 3123,
				path: '/1.0/books/22'
			}, function (res) {
				var buf = '';

				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					var obj = JSON.parse(buf);

					expect(res.statusCode).to.equal(200);
					expect(obj.id).to.equal(22);

					done();
				});
			}).end();
		});
	});

	describe('noderest methods\' context and arguments', function() {
		it('#get() should have req, res, next and correct arguments', function (_done) {
			var api = noderest.create({ version: '1.0' });

			api
				.resource('cars')
				.get('/:id', { id: /\d+/ }, function (params, done) {
					expect(this.req).to.be.an('object');
					expect(this.res).to.be.an('object');
					expect(this.next).to.be.a('function');
					expect(params).to.be.an('object');
					expect(done).to.be.a('function');

					done(null, { id: parseInt(params.id, 10) });

					_done();
				});

			app.use(noderest.middleware(api));

			http.request({
				port: 3123,
				path: '/1.0/cars/22'
			}, function () {}).end();
		});

		it('#getList() should have req, res, next and correct arguments', function (_done) {
			var api = noderest.create({ version: '1.0' });

			api
				.resource('cars')
				.getList(function (params, done) {
					expect(this.req).to.be.an('object');
					expect(this.res).to.be.an('object');
					expect(this.next).to.be.a('function');
					expect(params).to.be.an('object');
					expect(done).to.be.a('function');

					done(null, []);

					_done();
				});

			app.use(noderest.middleware(api));

			http.request({
				port: 3123,
				path: '/1.0/cars'
			}, function () {}).end();
		});
	});

	describe('#getList()', function () {
		before(function() {
			app.use(function (req, res) {
				res.statusCode = 404;
				res.end();
			});
		});

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
});
