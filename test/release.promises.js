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

test('should release lock successfully', async t => {
	const result = await t.context.lock.release(t.context.lockName);
	t.is(result, null);
});

test('should throw on unknown lock', async t => {
	const err = await t.throws(t.context.lock.release('unknown_lock'));

	t.is(err.message, `Lock release error, there is no such lock`);
	t.true(err instanceof error.ReleaseError);
});

test('should throw on Redis error', async t => {
	const client = new redis.createClient();

	const stub = sinon.stub(client, 'del').yields(new Error(`Some Redis Error`));
	const lock = new Lib({
		client: client
	});

	const err = await t.throws(lock.release(t.context.lockName));
	t.is(err.message, `Some Redis Error`);
	t.true(err instanceof error.RedisError);
});
