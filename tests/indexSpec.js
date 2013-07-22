/*global describe: false, it: false, beforeEach: false */

'use strict';

var noderest = require('../index'),
	expect   = require('chai').expect;

describe('noderest', function () {
	it('should expose public methods', function () {
		expect(noderest.create).to.be.a('function');
		expect(noderest.middleware).to.be.a('function');
	});
});
