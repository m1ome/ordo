'use strict';

const util = require('util');

function RedisError(message) {
	Error.captureStackTrace(this, RedisError);
	this.name = 'RedisError';
	this.message = message;
}

function AcquireError(message) {
	Error.captureStackTrace(this, AcquireError);
	this.name = 'AcquireError';
	this.message = message;
}

function ReleaseError(message) {
	Error.captureStackTrace(this, ReleaseError);
	this.name = 'ReleaseError';
	this.message = message;
}

util.inherits(AcquireError, Error);
util.inherits(RedisError, Error);
util.inherits(ReleaseError, Error);

exports.AcquireError = AcquireError;
exports.RedisError = RedisError;
exports.ReleaseError = ReleaseError;
