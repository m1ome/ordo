'use strict';

const redis = require('redis');
const Lib = require('../src');
const error = require('../src/error');


describe('Release', () => {
	this.lockName = 'testing-lock-name-release';
	this.lock = new Lib();

	beforeEach((done) => {
		this.lock.lock(this.lockName).then(() => {
			done();
		});
	});

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
			this.lock.release();
		}).toThrow(new TypeError('You should provide "key" as a string'));
	});

	describe('Promises', () => {
		it('should release lock successfully', (done) => {
			this.lock.release(this.lockName).then((res) => {
				expect(res).toEqual(null);
				done();
			});
		});

		it('should throw on unknown lock', (done) => {
			this.lock.release('unknown_lock').catch(err => {
				expect(err).toEqual(new error.ReleaseError('Lock release error, there is no such lock'));
				done();
			});
		});

		it('should throw on Redis error', (done) => {
			const client = new redis.createClient();

			spyOn(client, 'del').and.callFake(function(key, cb) {
				return cb(new Error(`Some Redis Error`));
			});

			const lock = new Lib({
				client: client
			});

			lock.release(this.lockName).catch(err => {
				expect(err).not.toEqual(null);
				expect(err).toEqual(new error.RedisError(`Error: Some Redis Error`));
				done();
			});
		});
	});

	describe('Callbacks', () => {
		it('should release lock successfully', (done) => {
			this.lock.release(this.lockName, (err, res) => {
				expect(err).toEqual(null);
				expect(res).toEqual(null);
				done();
			});
		});

		it('should throw on unknown lock', (done) => {
			this.lock.release('unknown_lock', (err, result) => {
				expect(err).toEqual(new error.ReleaseError('Lock release error, there is no such lock'));
				done();
			});
		});

		it('should throw on Redis error', (done) => {
			const client = new redis.createClient();

			spyOn(client, 'del').and.callFake(function(key, cb) {
				return cb(new Error(`Some Redis Error`));
			});

			const lock = new Lib({
				client: client
			});

			lock.release(this.lockName, (err) => {
				expect(err).not.toEqual(null);
				expect(err).toEqual(new error.RedisError(`Error: Some Redis Error`));
				done();
			});
		});
	});
});
