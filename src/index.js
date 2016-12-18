/* eslint-disable no-mixed-operators */
/* eslint-disable new-cap */
'use strict';

/**
* Dependencies
*/
const Promise = require('bluebird');
const debug = require('debug')('ordo');
const redis = require('redis');
const parse = require('parse-redis-url');
const error = require('./error');

const defaults = {
	timeout: 10,
	ttl: 10,
	delay: 25
};

/**
* Constructor of lock libarary.
* Options can be provided 2 way down:
* 1. as a string (https://www.npmjs.com/package/parse-redis-url look here!)
* 2. as a object with params
* - port (Default: 6379)
* - host (Default: '127.0.0.1')
* - client (Default: null) You can provide your own Redis.io client
* - password (Default: null)
* - database (Default: null)
* - prefix (Default: 'ordo:lock')
*
* @param {Object|String} options Options for Redis connection
*/
function Ordo(options) {
	options = options ? options : {};

	if (typeof options === 'string') {
		options = parse(options);
	}

	const port = options.port || null;
	const host = options.host || null;
	const client = options.client || null;
	const password = options.password || null;
	const database = options.database || null;
	const prefix = options.prefix || null;

	this._setClient(client, host, port, options);
	this._setPassword(password);
	this._setDatabase(database);

	this.prefix = prefix || 'ordo:lock:';
}

/**
 * Setting client
 * @param {Object} client  Redis client
 * @param {String} host    Host if we connecting to some non-default host
 * @param {string} port    Port if we connecting to non-default port
 * @param {Object} options Additional Redis parameters
 */
Ordo.prototype._setClient = function (client, host, port, options) {
	if (client) {
		this.client = client;
	} else if (!port && !host) {
		this.client = new redis.createClient();
	} else {
		options.prefix = null;
		this.client = new redis.createClient(port, host, options);
	}
};

/**
 * Adding auth support to Redis client
 * @param {String} password Redis password
 */
Ordo.prototype._setPassword = function (password) {
	if (password) {
		this.client.auth(password, err => {
			if (err) {
				throw err;
			}
		});
	}
};

/**
 * Selecting custom database
 * @param {String} database Database ID
 */
Ordo.prototype._setDatabase = function (database) {
	if (database) {
		this.client.select(database, err => {
			if (err) {
				throw err;
			}
		});
	}
};

/**
* Lock obtaining function.
*
* @param  {String}   key     Lock name, should be provided
* @param  {Object}   options Object of options
*                    - timeout (Default: 10s) Timeout waiting for lock
*                    - ttl (Default: 10s) Lock time to live
* @param  {Function} cb      You can set this if you wanna do in callback way!
* @return {Promise|Function}
*/
Ordo.prototype.lock = function (key, options, cb) {
	options = options ? options : {};

	if (typeof key !== 'string') {
		throw new TypeError('You should provide "key" as a string');
	}

	if (typeof options === 'function') {
		cb = options;
		options = {};
	}

	const timeout = (options.timeout ? options.timeout : defaults.timeout) * 1000;
	const ttl = (options.ttl ? options.ttl : defaults.ttl) * 1000;
	const delay = (options.delay ? options.delay : defaults.delay);
	const k = `${this.prefix}${key}`;

	const lock = this._lock(k, {
		timeout: timeout,
		ttl: ttl,
		delay: delay
	});

	if (cb === undefined) {
		return lock;
	}

	lock.then(result => {
		cb(null, result);
	}).catch(err => {
		cb(err);
	});
};

/**
 * Lock function
 *
 * @param  {String} k       Key of lock
 * @param  {Object} options timeout, ttl and delay options
 * @return {Promise}
 */
Ordo.prototype._lock = function (k, options) {
	const timeout = options.timeout;
	const ttl = options.ttl;
	const delay = options.delay;

	return new Promise((resolve, reject) => {
		var loop = null;
		var attempts = 0;
		const start = process.hrtime();

		const acquireLock = () => {
			attempts++;
			const diff = process.hrtime(start);
			const elapsed = parseFloat((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(4);

			if (elapsed > timeout) {
				debug(`[LOCK:ERROR] Couldn't obtain lock in ${timeout} ms`);

				if (loop !== null) {
					clearInterval(loop);
				}

				return reject(new error.AcquireError('Error while obtaining lock'));
			}

			this.client.set(k, 1, 'NX', 'PX', ttl + ttl / 2, (err, result) => {
				debug(`[LOCK:SET] Key: "${k}", Attempt: ${attempts}, Elapsed: ${elapsed}ms.`);

				if (err) {
					if (loop !== null) {
						clearInterval(loop);
					}

					return reject(new error.RedisError(err));
				}

				if (result !== null) {
					debug(`[LOCK:OBTAINED] Key: "${k}", Attempts: ${attempts}, Elapsed: ${elapsed}ms.`);

					if (loop !== null) {
						clearInterval(loop);
					}

					const info = {
						elapsed: elapsed,
						attempts: attempts
					};

					return resolve(info);
				}
			});
		};

		// Launching spinlock
		acquireLock();
		loop = setInterval(acquireLock, delay);
	});
};

/**
* Lock releasing.
*
* @param  {string}   key Lock name, should be provided
* @param  {Function} cb  You can set this if you wanna do in callback way!
* @return {Promise|Function}
*/
Ordo.prototype.release = function (key, cb) {
	if (typeof key !== 'string') {
		throw new TypeError('You should provide "key" as a string');
	}

	const k = `${this.prefix}${key}`;
	const release = new Promise((resolve, reject) => {
		this.client.del(k, (err, data) => {
			if (err) {
				return reject(new error.RedisError(err));
			}

			if (parseInt(data, 10) < 1) {
				return reject(new error.ReleaseError(`Lock release error, there is no such lock`));
			}

			debug(`[LOCK:RELEASE] releasing "${k}" lock`);

			return resolve(null);
		});
	});

	if (cb === undefined) {
		return release;
	}

	release.then(result => {
		return cb(null, result);
	})
	.catch(err => {
		return cb(err);
	});
};

module.exports = Ordo;
