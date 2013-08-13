/*global describe: false, it: false, beforeEach: false */

'use strict';

var noderest = require('../index'),
	express  = require('express'),
	http     = require('http');

var expect   = require('chai').expect;

describe('noderest', function () {
	describe('initialize', function () {
		it('not using existing express app', function (done) {
			var api = noderest({ version: '1.0', basePath: 'api' });
			api.init();

			api.resource('products').getList(function (params, send) {
				send(null, [{ id: 1 }, { id: 2 }]);
			});

			var server = api.listen(3000);

			var req = http.request({
				port: 3000,
				path: '/api/1.0/products'
			}, function (res) {
				var buf = '';

				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					var data = JSON.parse(buf);
					expect(data).to.have.length(2);

					server.close(function () {
						done();
					});
				});
			});
			req.end();
		});

		it('using existing express app', function (done) {
			var api = noderest({ version: '1.0', basePath: 'api' }),
				app = express();

			api.init(app);

			api.resource('products').getList(function (params, send) {
				send(null, [{ id: 1 }, { id: 2 }]);
			});

			var server = api.listen(3002);

			var req = http.request({
				port: 3002,
				path: '/api/1.0/products'
			}, function (res) {
				var buf = '';

				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					var data = JSON.parse(buf);
					expect(data).to.have.length(2);

					server.close(function () {
						done();
					});
				});
			});
			req.end();
		});
	});

	describe('public methods', function () {
		function close(server, counter, done) {
			if (counter === 0) {
				server.close(function () {
					done();
				});
			}
		}

		var api;

		beforeEach(function () {
			api = noderest({ basePath: 'api' });
			api.init();
		});

		it('#getList()', function (done) {
			var doneCounter = 2;

			api.resource('products').getList(function (params, send) {
				var arr = [],
					limit = params.limit || 10;

				for (var i = 0; i < limit; i++) {
					arr[i] = { id: i };
				}

				send(null, arr);
			});

			var server = api.listen(3000);

			http.request({
				port: 3000,
				path: '/api/products'
			}, function (res) {
				var buf = '';
				res.on('data', function (chunk) { buf += chunk; });
				res.on('end', function () {
					var data = JSON.parse(buf);
					expect(data).to.have.length(10);
					close(server, --doneCounter, done);
				});
			}).end();

			http.request({
				port: 3000,
				path: '/api/products?limit=5'
			}, function (res) {
				var buf = '';
				res.on('data', function (chunk) { buf += chunk; });
				res.on('end', function () {
					var data = JSON.parse(buf);
					expect(data).to.have.length(5);
					close(server, --doneCounter, done);
				});
			}).end();
		});

		it('#get()', function (done) {
			var doneCounter = 1;

			api.resource('products').get('/:id', { id: /\d+/ }, function (params, send) {
				var id = parseInt(params.id, 10);
				send(null, { id: id });
			});

			var server = api.listen(3000);

			http.request({
				port: 3000,
				path: '/api/products/1'
			}, function (res) {
				var buf = '';
				res.on('data', function (chunk) { buf += chunk; });
				res.on('end', function () {
					var data = JSON.parse(buf);
					expect(data).to.have.property('id', 1);
					close(server, --doneCounter, done);
				});
			}).end();
		});
	});
});

