/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
'use strict';

import test from 'ava';
import redis from 'redis';
import sinon from 'sinon';
import Lib from '../src';
import error from '../src/error';

// Setting testing environment
test.beforeEach(t => {
	t.context.lockName = 'testing-lock-name';
	t.context.lock = new Lib();
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
		t.context.lock.lock();
	}, TypeError);

	t.is(error.message, 'You should provide "key" as a string');
});

test('clean timeout after loop launches and lock obtain failed', async t => {
	const client = new redis.createClient();

	const stub = sinon.stub(client, 'set');
	stub.onFirstCall().returns(null)
		.onSecondCall().yields(new Error(`Some Redis Error`));

	const lock = new Lib({
		client: client
	});

	const err = await t.throws(lock.lock(t.context.lockName));
	t.is(err.message, `Some Redis Error`);
	t.true(err instanceof error.RedisError);
});

test('locking with default parameters', async t => {
	const lock = await t.context.lock.lock(t.context.lockName);
	t.not(lock, null);
	t.not(lock.elapsed, undefined);
	t.not(lock.attempts, undefined);
});

test('locking with custom {timeout/ttl}', async t => {
	const lock = await t.context.lock.lock(t.context.lockName, {ttl: 0.1, timeout: 1});
	t.not(lock, null);
	t.not(lock.elapsed, undefined);
	t.not(lock.attempts, undefined);
});

test('throwing on lock obtain failure', async t => {
	const l = t.context.lockName + '-promise-blocker';
	const lock = await t.context.lock.lock(l);
	const err = await t.throws(t.context.lock.lock(l, {timeout: 0.1}));
	const release = await t.context.lock.release(l);

	t.is(err.message, `Error while obtaining lock`);
	t.true(err instanceof error.AcquireError);
	t.is(release, null);
});
