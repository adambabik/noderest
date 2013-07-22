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
			expect(builder.config).to.deep.equal({ version: null, basePath: null, types: ['json'] });
			expect(builder.pathFragments).to.be.empty;
		});

		it('instantiate with version and basePath', function () {
			builder = new Builder({
				version: '1.0',
				basePath: 'api'
			});

			expect(builder).to.be.an('object');
			expect(builder.config).to.deep.equal({ version: '1.0', basePath: 'api', types: ['json'] });
			expect(builder.pathFragments).to.deep.equal(['api', '1.0']);
		});
	});

	it('#_buildRegExp()', function () {
		var buildRegExp = Builder.prototype._buildRegExp, re;

		expect(buildRegExp(['products'])).instanceof(RegExp);

		re = buildRegExp(['products']);
		expect('/products').to.match(re);
		expect('/products/').to.not.match(re);
		expect('/products?test=true').to.not.match(re); // test only against pathname

		re = buildRegExp(['products', 'books']);
		expect('/products/books').to.match(re);

		re = buildRegExp(['products', '(\\d+)']);
		expect('/products').to.not.match(re);
		expect('/products/1').to.match(re);
		expect('/products/1?test=true').to.not.match(re); // test only against pathname

		re = buildRegExp(['products', 'books', '(\\d+)']);
		expect('/products/books').to.not.match(re);
		expect('/products/books/1').to.match(re);
	});

	it('#resource()', function () {
		var ref;

		builder = new Builder({ version: '1.0' });
		ref = builder.resource('products');

		expect(ref).to.equal(builder);
		expect(builder.pathFragments).deep.equal(['1.0', 'products']);
		expect(builder.resources).to.have.length(0);
	});

	it('#getList()', function () {
		var resource, ref;

		ref = builder.resource('products').getList(function () {});

		expect(builder.pathFragments).to.deep.equal(['products']);
		expect(builder.resources).to.have.length(1);

		resource = builder.resources[0];

		expect(resource).to.be.instanceof(Resource);
		expect(resource.type).to.equal(Resource.Type.LIST);
		expect('/products').to.match(resource.path);
		expect('/products/').to.not.match(resource.path);
		expect('/products/1').to.not.match(resource.path);
		expect('/products/books').to.not.match(resource.path);

		// test nested resource

		ref = ref.resource('books').getList(function () {});

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
		resource = builder.resources[0];

		expect(builder.pathFragments).to.deep.equal(['products', '(\\d+)']);
		expect(builder.resources).to.have.length(1);
		expect(resource.type).to.equal(Resource.Type.GET);
		expect('/products').to.not.match(resource.path);
		expect('/products/1').to.match(resource.path);
	});
});
