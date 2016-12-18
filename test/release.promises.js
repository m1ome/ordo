/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
'use strict';

import test from 'ava';
import redis from 'redis';
import sinon from 'sinon';
import Lib from '../src';
import error from '../src/error';

// Setting testing environment
test.beforeEach.cb(t => {
	t.context.lockName = 'testing-lock-name-release';
	t.context.lock = new Lib();

	t.context.lock.lock(t.context.lockName).then(() => {
		t.end();
	});
});

// Release lock
test.afterEach.cb.always(t => {
	t.context.lock.release(t.context.lockName)
	.then(() => {
		t.end();
	})
	.catch(() => {
		t.end();
	});
});

// Test suite
test('throws on wrong key', t => {
	const error = t.throws(() => {
		t.context.lock.release();
	}, TypeError);

	t.is(error.message, 'You should provide "key" as a string');
});

// 	describe('Promises', () => {
// 		it('should release lock successfully', (done) => {
// 			this.lock.release(this.lockName).then((res) => {
// 				expect(res).toEqual(null);
// 				done();
// 			});
// 		});
//
// 		it('should throw on unknown lock', (done) => {
// 			this.lock.release('unknown_lock').catch(err => {
// 				expect(err).toEqual(new error.ReleaseError('Lock release error, there is no such lock'));
// 				done();
// 			});
// 		});
//
// 		it('should throw on Redis error', (done) => {
// 			const client = new redis.createClient();
//
// 			spyOn(client, 'del').and.callFake(function(key, cb) {
// 				return cb(new Error(`Some Redis Error`));
// 			});
//
// 			const lock = new Lib({
// 				client: client
// 			});
//
// 			lock.release(this.lockName).catch(err => {
// 				expect(err).not.toEqual(null);
// 				expect(err).toEqual(new error.RedisError(`Error: Some Redis Error`));
// 				done();
// 			});
// 		});
// 	});
