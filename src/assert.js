'use strict';

module.exports = {
	'str': function assertString(arg) {
		if (typeof arg !== 'string' || arg === '') {
			throw new Error("Argument must be a string");
		}
	},

	'fun': function assertFunction(arg) {
		if (typeof arg !== 'function') {
			throw new Error("Argument must be a function");
		}
	},

	'num': function assertNumber(arg) {
		if (typeof arg !== 'number') {
			throw new Error("Argument must be a number");
		}
	}
};
