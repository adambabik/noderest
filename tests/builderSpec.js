/*global describe: false, it: false, beforeEach: false */

'use strict';

var expect   = require('chai').expect,
	Builder  = require('../src/builder'),
	Resource = require('../src/resource');

describe('Builder', function () {
	var builder;

	beforeEach(function () {
		builder = new Builder({});
	});

	describe('#controller()', function () {
		it('instantiate without config', function () {
			builder = new Builder();
			expect(builder).to.be.an('object');
			expect(builder.config).to.deep.equal({ version: null, basePath: null, typeSuffix: false, types: ['json'] });
			expect(builder.pathFragments).to.be.empty;
		});

		it('instantiate with version and basePath', function () {
			builder = new Builder({
				version: '1.0',
				basePath: 'api'
			});

			expect(builder).to.be.an('object');
			expect(builder.config).to.deep.equal({
				version: '1.0',
				basePath: 'api',
				typeSuffix: false,
				types: ['json']
			});
			expect(builder.pathFragments).to.deep.equal([]);
		});

		it('instantiate with path fragments', function () {
			builder = new Builder(null, ['products']);
			expect(builder.pathFragments).to.deep.equal(['products']);
		});

		it('instantiate with type suffix', function () {
			builder = new Builder({
				typeSuffix: true
			});

			expect(builder.config).to.deep.equal({
				version: null,
				basePath: null,
				typeSuffix: true,
				types: ['json']
			});
		});
	});

	it('#_buildRegExp()', function () {
		var re;
		builder = new Builder();

		expect(builder._buildRegExp([])).instanceof(RegExp);

		re = builder._buildRegExp(['products']);
		expect('/products').to.match(re);
		expect('/products/').to.not.match(re);
		expect('/products?test=true').to.not.match(re); // test only against pathname

		re = builder._buildRegExp(['products', 'books']);
		expect('/products/books').to.match(re);

		re = builder._buildRegExp(['products', '(\\d+)']);
		expect('/products').to.not.match(re);
		expect('/products/1').to.match(re);
		expect('/products/1?test=true').to.not.match(re); // test only against pathname

		re = builder._buildRegExp(['products', 'books', '(\\d+)']);
		expect('/products/books').to.not.match(re);
		expect('/products/books/1').to.match(re);

		builder = new Builder({ version: '1.0' });
		re = builder._buildRegExp(['products']);
		expect('/1.0/products').to.match(re);

		builder = new Builder({ basePath: 'api' });
		re = builder._buildRegExp(['products']);
		expect('/api/products').to.match(re);

		builder = new Builder({ version: '1.0', basePath: 'api' });
		re = builder._buildRegExp(['products']);
		expect('/api/1.0/products').to.match(re);

		builder = new Builder({ typeSuffix: true });
		re = builder._buildRegExp(['products']);
		expect('/products.json').to.match(re);
	});

	it('#_parsePath()', function () {
		builder = new Builder();
		builder.pathFragments.push('products');

		expect(builder._parsePath('/products/:id', { id: /\d+/ })).to.deep.equal(['(\\d+)']);
		expect(
			builder._parsePath(
				'/products/:id/:name',
				{ id: /\d+/, name: /\w+/ }
			)
		).to.deep.equal(['(\\d+)', '(\\w+)']);

		// this is the case when /products/:id was defined earlier
		builder.pathFragments.push('(\\d+)');
		expect(builder._parsePath('/cars/:name', { name: /\w+/ })).to.deep.equal(['(\\w+)']);
	});

	it('#resource()', function () {
		var res;

		builder = new Builder({ version: '1.0' });
		res = builder.resource('products');

		expect(builder.pathFragments).to.deep.equal(['products']);
		expect(res).to.equal(builder);
		expect(res.pathFragments).to.deep.equal(['products']);
		expect(res.resources).to.have.length(0);

		// handling references
		var res2 = builder.resource('books');
		expect(res2).to.equal(res);
		expect(res2.pathFragments).to.deep.equal(['products', 'books']);
	});

	it('#getList()', function () {
		var resource, res;

		res = builder.resource('products').getList(function () {});

		expect(res.pathFragments).to.deep.equal(['products']);
		expect(builder.resources).to.have.length(1);

		resource = builder.resources[0];

		expect(resource).to.be.instanceof(Resource);
		expect(resource.type).to.equal(Resource.Type.LIST);
		expect('/products').to.match(resource.path);
		expect('/products/').to.not.match(resource.path);
		expect('/products/1').to.not.match(resource.path);
		expect('/products/books').to.not.match(resource.path);

		// test nested resource

		res = res.resource('books').getList(function () {});

		expect(builder.pathFragments).to.deep.equal(['products', 'books']);
		expect(builder.resources).to.have.length(2);

		resource = builder.resources[1];

		expect(resource).to.be.instanceof(Resource);
		expect(resource.type).to.equal(Resource.Type.LIST);
		expect('/products').to.not.match(resource.path);
		expect('/products/books').to.match(resource.path);
	});

	it('#get()', function () {
		var resource;

		builder.resource('products').get('/:id', { id: /\d+/ }, function () {});

		expect(builder.pathFragments).to.deep.equal(['products', '(\\d+)']);
		expect(builder.resources).to.have.length(1);

		resource = builder.resources[0];
		expect(resource.type).to.equal(Resource.Type.GET);
		expect('/products').to.not.match(resource.path);
		expect('/products/1').to.match(resource.path);
	});

	it('#save()', function () {
		var resource;

		builder.resource('products').save(function () {});

		expect(builder.pathFragments).to.deep.equal(['products']);
		expect(builder.resources).to.have.length(1);

		resource = builder.resources[0];
		expect(resource.type).to.equal(Resource.Type.SAVE);
		expect('/products').to.match(resource.path);
		expect('/products/1').to.not.match(resource.path);
	});

	it('#detach()', function () {
		builder = new Builder({ version: '1.0' });

		var res = builder.resource('products').detach();

		builder.resource('books').getList(function () {});
		res.resource('cars');

		expect(builder.pathFragments).to.deep.equal(['products', 'books']);
		expect(res.pathFragments).to.deep.equal(['products', 'cars']);

		expect(builder.resources).to.have.length(1);
		expect('/1.0/products/books').to.match(builder.resources[0].path);
		expect(res.resources).to.have.length(0);
	});

	describe('#findResource()', function () {
		var findResource = builder.findResource,
			resources;

		it('empty resources', function () {
			expect(findResource(resources, '/books', 'GET')).to.be.null;
		});

		it('list resource', function () {
			var getBooks = new Resource(Resource.Type.LIST, /^\/books$/, {}, null);
			resources.push(getBooks);

			expect(findResource(resources, '/books', 'GET')).to.equal(getBooks);
			expect(findResource(resources, '/books/', 'GET')).to.be.null;
			expect(findResource(resources, '/books/1', 'GET')).to.be.null;
			expect(findResource(resources, '/books', 'POST')).to.be.null;
			expect(findResource(resources, '/books', 'PUT')).to.be.null;
			expect(findResource(resources, '/books', 'DELETE')).to.be.null;
		});

		it('save resource', function () {
			expect(findResource(resources, '/cars', 'POST')).to.be.null;

			var saveCars = new Resource(Resource.Type.SAVE, /^\/cars$/, {}, null);
			resources.push(saveCars);

			expect(findResource(resources, '/cars', 'GET')).to.be.null;
			expect(findResource(resources, '/cars', 'POST')).to.equal(saveCars);
		});

		it('put resource', function () {
			expect(findResource(resources, '/books/1', 'PUT')).to.be.null;
			resources.push(new Resource(Resource.Type.UPDATE, /^\/books\/(\d+)$/, null, null));
			expect(findResource(resources, '/books/1', 'PUT')).to.be.instanceof(Resource);
			expect(findResource(resources, '/books/1', 'GET')).to.be.null;
		});

		it('delete resource', function () {
			expect(findResource(resources, '/books/1', 'DELETE')).to.be.null;
			resources.push(new Resource(Resource.Type.DELETE, /^\/books\/(\d+)$/, null, null));
			expect(findResource(resources, '/books/1', 'DELETE')).to.be.instanceof(Resource);
			expect(findResource(resources, '/books/1', 'GET')).to.be.null;
		});
	});
});
