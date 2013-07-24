/*global describe: false, it: false, beforeEach: false */

'use strict';

var middleware = require('../src/middleware'),
	Resource   = require('../src/resource'),
	Builder    = require('../src/builder'),
	expect     = require('chai').expect;

describe('middleware', function () {
	describe('createContext', function () {
		it('return an object with node\'s middleware properties', function () {
			expect(middleware.createContext(null, null, null)).
				to.deep.equal({ req: null, res: null, next: null });
		});
	});

	describe('urlParts', function () {
		it('return correct parts without version and basePath', function () {
			var urlParts = middleware.parseUrl,
				api      = { config: { version: null, basePath: '' } };

			expect(urlParts('/books/1', api)).to.deep.equal({ rest: ['books', '1'] });
		});

		it('return correct parts with version and without basePath', function () {
			var urlParts = middleware.parseUrl,
				api      = { config: { version: '1.0', basePath: null } };

			expect(urlParts('/1.0/books/1', api)).to.deep.equal({ version: '1.0', rest: ['books', '1'] });
		});

		it('return correct parts with version and basePath', function () {
			var urlParts = middleware.parseUrl,
				api      = { config: { version: '1.0', basePath: '/api' } };

			expect(urlParts('/api/1.0/books/1', api)).to.deep.equal(
				{ version: '1.0', basePath: 'api', rest: ['books', '1'] }
			);
		});
	});

	describe('parseParams', function () {
		it('return params', function () {
			var parseParams = middleware.parseParams;
			var resource    = new Resource(
				Resource.Type.GET,
				/^\/books\/(\d+)$/,
				{
					id: { re: /\d+/, index: 1 }
				},
				null
			);

			expect(parseParams(resource, null, ['books', '1'])).to.deep.equal({ id: '1' });
			expect(parseParams(resource, {}, ['books', '1'])).to.deep.equal({ id: '1' });
			expect(parseParams(resource, { test: 'true' }, ['books', '1'])).to.deep.equal({ id: '1', test: 'true' });
		});
	});

	describe('itself', function () {
		it('export function that returns function', function () {
			expect(middleware.setup).to.be.a('function');
			expect(middleware.setup).to.throw(Error);
			expect(middleware.setup({})).to.be.a('function');
		});

		it('should call next() if no resource is found', function (done) {
			var api = new Builder();

			var instance = middleware.setup(api);

			var req = {
				url: '/books',
				query: {}
			};

			var next = function () {
				done();
			};

			expect(instance(req, {}, next));
		});

		it('call handler with the context, params object and callback', function (_done) {
			var resource = new Resource(
				Resource.Type.GET,
				/^\/books$/,
				{},
				function (params, done) {
					expect(params).to.be.an('object');
					expect(done).to.be.a('function');

					expect(params.test).to.equal('true');

					expect(this.req).to.be.an('object');
					expect(this.req.url).to.be.a('string');

					expect(this.res).to.be.an('object');
					expect(this.res.end).to.be.a('function');

					done(null, [{ id: 1 }, { id: 2 }]);
				}
			);
			var api = new Builder(null, null, [resource]);
			var instance = middleware.setup(api);

			var req = {
				url: '/books?test=true',
				query: { test: 'true' },
				method: 'GET'
			};

			var next = function () {
				_done(false);
			};

			var res = {
				end: function (data) {
					console.log(data);
					expect(data).to.be.a('string');

					data = JSON.parse(data);

					expect(data).to.be.an('array');
					expect(data).to.have.length(2);

					_done();
				},
				setHeader: function () {}
			};

			instance(req, res, next)
		});
	});
});
