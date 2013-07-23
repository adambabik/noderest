'use strict';

var a = module.exports = {};

a.str = function assertString(arg) {
	if (typeof arg !== 'string' || arg === '') {
		throw new Error("Argument must be a string");
	}
};

a.fun = function assertFunction(arg) {
	if (typeof arg !== 'function') {
		throw new Error("Argument must be a function");
	}
};

a.num = function assertNumber(arg) {
	if (typeof arg !== 'number') {
		throw new Error("Argument must be a number");
	}
};
