/*global describe: false, it: false, beforeEach: false */

'use strict';

var middleware = require('../src/middleware'),
	Resource   = require('../src/resource'),
	expect     = require('chai').expect;

describe('middleware', function () {
	describe('createContext', function () {
		it('return an object with node\'s middleware properties', function () {
			expect(middleware._private.createContext(null, null, null)).
				to.deep.equal({ req: null, res: null, next: null });
		});
	});

	describe('urlParts', function () {
		it('return correct parts without version and basePath', function () {
			var urlParts = middleware._private.urlParts,
				api      = { config: { version: null, basePath: null } };

			expect(urlParts(api, '/books/1')).to.deep.equal(['books', '1']);
		});

		it('return correct parts with version and without basePath', function () {
			var urlParts = middleware._private.urlParts,
				api      = { config: { version: '1.0', basePath: null } };

			expect(urlParts(api, '/1.0/books/1')).to.deep.equal(['books', '1']);
		});

		it('return correct parts with version and basePath', function () {
			var urlParts = middleware._private.urlParts,
				api      = { config: { version: '1.0', basePath: '/api' } };

			expect(urlParts(api, '/api/1.0/books/1')).to.deep.equal(['books', '1']);
		});
	});

	describe('findResource', function () {
		it('return null or resource', function () {
			var findResource = middleware._private.findResource,
				resources    = [];

			// with empty resources
			expect(findResource(resources, '/books')).to.be.null;

			var getBooks = new Resource(Resource.Type.LIST, /^\/books$/, {}, null);
			resources.push(getBooks);

			// make sure if the resource is found
			expect(findResource(resources, '/books')).to.equal(getBooks);
			expect(findResource(resources, '/books/')).to.be.null;
			expect(findResource(resources, '/books/1')).to.be.null;
		});
	});

	describe('parseParams', function () {
		it('return params', function () {
			var parseParams = middleware._private.parseParams,
				resource    = new Resource(Resource.Type.GET, /^\/books\/(\d+)$/, { id: { re: /\d+/, index: 1 } }, null);

			expect(parseParams(resource, null, ['books', '1'])).to.deep.equal({ id: '1' });
			expect(parseParams(resource, {}, ['books', '1'])).to.deep.equal({ id: '1' });
			expect(parseParams(resource, { test: 'true' }, ['books', '1'])).to.deep.equal({ id: '1', test: 'true' });
		});
	});

	describe('itself', function () {
		it('export function that returns function', function () {
			expect(middleware).to.be.a('function');
			expect(middleware).to.throw(Error);
			expect(middleware({})).to.be.a('function');
		});

		it('should call next() if no resource is found', function (done) {
			var api = {
				config: { version: null, basePath: null },
				resources: []
			};

			var instance = middleware(api);

			var req = {
				url: '/books',
				query: {}
			};

			var next = function () {
				done();
			};

			expect(instance(req, null, next));
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

					expect(this.next).to.be.a('function');

					done(null, [{ id: 1 }, { id: 2 }]);
				}
			);
			var api = {
				config: { version: null, basePath: null },
				resources: [resource]
			};
			var instance = middleware(api);

			var req = {
				url: '/books?test=true',
				query: { test: 'true' }
			};

			var next = function () {
				_done(false);
			};

			var res = {
				end: function (data) {
					expect(data).to.be.a('string');

					data = JSON.parse(data);

					expect(data).to.be.an('array');
					expect(data).to.have.length(2);

					_done();
				}
			};

			expect(instance(req, res, next));
		});
	});
});
