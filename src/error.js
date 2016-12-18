'use strict';

const util = require('util');

var errors = module.exports = {};

const names = ['RedisError', 'AcquireError', 'ReleaseError'];
names.forEach(name => {
	const err = function (message) {
		Error.captureStackTrace(this, this.constructor);
		this.name = name;

		if (message instanceof Error) {
			this.message = message.message;
		} else {
			this.message = message;
		}
	};
	util.inherits(err, Error);

	errors[name] = err;
});
