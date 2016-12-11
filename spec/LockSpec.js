'use strict';

const redis = require('redis');
const Lib = require('../src');
const error = require('../src/error');

describe('Lock', () => {
	this.lockName = 'testing-lock-name';
	this.lock = new Lib();

	afterEach((done) => {
		this.lock
		.release(this.lockName)
		.then(() => {
			done();
		})
		.catch(err => {
			done();
		});
	});

	it('should throw on wrong key', () => {
		expect(() => {
			this.lock.lock();
		}).toThrow(new TypeError('You should provide "key" as a string'));
	});

	it('should clean timeout after loop launches and lock obtain failed', (done) => {
		const client = new redis.createClient();
		var retries  = 0;

		spyOn(client, 'set').and.callFake(function(key, value, nx, px, ttl, cb) {
			retries++;

			if (retries > 3) {
				return cb(new Error(`Some Redis Error`));
			} else {
				return null;
			}
		});

		const lock = new Lib({
			client: client
		});

		lock.lock(this.lockName, (err, result) => {
			expect(err).not.toEqual(null);
			expect(err).toEqual(new error.RedisError(`Error: Some Redis Error`));
			done();
		});
	});

	describe('Promises', () => {
		it('should lock with default params', (done) => {
			this.lock.lock(this.lockName).then(data => {
				expect(data.elapsed).not.toEqual(undefined);
				expect(data.attempts).not.toEqual(undefined);
				done();
			});
		});

		it('should lock when we providing custom params timeout/ttl', (done) => {
			this.lock
			.lock(this.lockName, {ttl: 0.1, timeout: 1})
			.then(data => {
				expect(data.elapsed).not.toEqual(undefined);
				expect(data.attempts).not.toEqual(undefined);

				return new Promise((resolve, reject) => {
					setTimeout(() => {
						return resolve(this.lock.release(this.lockName));
					}, 200);
				});
			})
			.catch(err => {
				expect(err).toEqual(new error.ReleaseError('Lock release error, there is no such lock'));
				done();
			});
		});

		it('should throw on lock obtain failure', (done) => {
			this.lock
			.lock(this.lockName)
			.then(() => {
				this.lock
				.lock(this.lockName, {timeout: 1})
				.catch(err => {
					expect(err).toEqual(new error.AcquireError('Error while obtaining lock'));
					done();
				});
			});
		});

		it('should return Redis error', (done) => {
			const client = new redis.createClient();

			spyOn(client, 'set').and.callFake(function(key, value, nx, px, ttl, cb) {
				return cb(new Error(`Some Redis Error`));
			});

			const lock = new Lib({
				client: client
			});

			lock
			.lock(this.lockName)
			.catch(err => {
				expect(err).not.toEqual(null);
				expect(err).toEqual(new error.RedisError(`Error: Some Redis Error`));
				done();
			});
		});

	});

	describe('Callbacks', () => {
		it('should lock with default params', (done) => {
			this.lock.lock(this.lockName, (err, data) => {
				expect(err).toEqual(null);
				expect(data.elapsed).not.toEqual(undefined);
				expect(data.attempts).not.toEqual(undefined);

				done();
			});
		});

		it('should lock when we provide custom params timeout/ttl', (done) => {
			this.lock.lock(this.lockName, {ttl: 0.1, timeout: 10}, (err, data) => {
				expect(data.elapsed).not.toEqual(undefined);
				expect(data.attempts).not.toEqual(undefined);

				setTimeout(() => {
					this.lock.release(this.lockName, (err) => {
						expect(err).toEqual(new error.ReleaseError('Lock release error, there is no such lock'));
						done();
					});
				}, 150);
			});
		});

		it('should return error on lock obtain failure', (done) => {
			this.lock.lock(this.lockName, (err, data) => {
				this.lock.lock(this.lockName, {timeout: 1}, (err) => {
					expect(err).toEqual(new error.AcquireError('Error while obtaining lock'));
					done();
				});
			});
		});

		it('should return Redis error', (done) => {
			const client = new redis.createClient();

			spyOn(client, 'set').and.callFake(function(key, value, nx, px, ttl, cb) {
				return cb(new Error(`Some Redis Error`));
			});

			const lock = new Lib({
				client: client
			});

			lock.lock(this.lockName, (err, result) => {
				expect(err).not.toEqual(null);
				expect(err).toEqual(new error.RedisError(`Error: Some Redis Error`));
				done();
			});
		});

	});
});
