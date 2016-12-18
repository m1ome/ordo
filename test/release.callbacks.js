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

test.cb('should release lock successfully', t => {
	t.plan(2);

	t.context.lock.release(t.context.lockName, (err, res) => {
		t.is(err, null);
		t.is(res, null);
		t.end();
	});
});

test.cb('should throw on unknown lock', t => {
	t.plan(3);

	t.context.lock.release('unknown_lock', (err, result) => {
		t.not(err, null);
		t.is(err.message, `Lock release error, there is no such lock`);
		t.true(err instanceof error.ReleaseError);
		t.end();
	});
});

test.cb('should throw on Redis error', t => {
	t.plan(3);

	const client = new redis.createClient();

	const stub = sinon.stub(client, 'del').yields(new Error(`Some Redis Error`));
	const lock = new Lib({
		client: client
	});

	lock.release(t.context.lockName, err => {
		t.not(err, null);
		t.is(err.message, `Some Redis Error`);
		t.true(err instanceof error.RedisError);
		t.end();
	});
});
