/*global describe: false, it: false, beforeEach: false */

'use strict';

var expect  = require('chai').expect,
	Builder = require('../src/builder');

describe('Builder', function () {
	var builder;

	beforeEach(function () {
		builder = new Builder({
			version: ''
		});
	});

	it('#controller()', function () {
		expect(builder.config).to.be.an('object');
		expect(builder.pathFragments).to.have.length(1);
	});

	it('#resource()', function () {
		var ref = builder.resource('products');
		expect(builder).to.equal(ref);
		// one is an empty string or verison number, the second is `products`
		expect(builder.pathFragments).to.have.length(2);
	});

	it('#getList()', function () {
		var resource, match;

		builder.resource('products').getList(function () {});

		expect(builder.resources).to.have.length(1);

		resource = builder.resources[0];

		expect(resource).to.be.instanceof(Builder.Resource);

		match = resource.path.exec('/products').filter(function (m) {
			return !!m;
		});

		expect(resource.type).to.equal(Builder.Resource.Type.LIST);

		expect(match).to.not.be.null;
		expect(match).to.have.length(1);
		expect(match[0]).to.equal('/products');
	});

	it('#get()', function () {
		var resource, match;

		builder.resource('products').get('/:id', { id: /\d+/ }, function () {});

		expect(builder.resources).to.have.length(1);

		resource = builder.resources[0];
		match = resource.path.exec('/products/1').filter(function (m) {
			return !!m;
		});

		expect(resource.type).to.equal(Builder.Resource.Type.GET);

		expect(match).not.to.be.null;
		expect(match).to.have.length(2);
		expect(match[0]).to.equal('/products/1');
		expect(match[1]).to.equal('1');
	});
});
