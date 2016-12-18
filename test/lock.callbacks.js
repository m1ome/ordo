/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
/* eslint-disable ava/no-only-test */
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

test.cb('clean timeout after loop launches and lock obtain failed', t => {
	const client = new redis.createClient();

	const stub = sinon.stub(client, 'set');
	stub.onFirstCall().returns(null)
		.onSecondCall().yields(new Error(`Some Redis Error`));

	const lock = new Lib({
		client: client
	});

	lock.lock(t.context.lockName, (err, result) => {
		t.plan(3);
		t.not(err, null);
		t.is(err.message, `Some Redis Error`);
		t.true(err instanceof error.RedisError);
		t.end();
	});
});

test.cb('lock with default params', t => {
	t.plan(3);

	t.context.lock.lock(t.context.lockName, (err, data) => {
		t.is(err, null);
		t.not(data.elapsed, undefined);
		t.not(data.attempts, undefined);
		t.end();
	});
});

test.cb('lock when we provide custom {timeout/ttl}', t => {
	t.plan(3);

	t.context.lock.lock(t.context.lockName, {timeout: 0.1, ttl: 0.1}, (err, data) => {
		t.is(err, null);
		t.not(data.elapsed, undefined);
		t.not(data.attempts, undefined);
		t.end();
	});
});

test.cb('return error on lock obtaining failure', t => {
	t.plan(7);
	const l = t.context.lockName + '-blocker';

	t.context.lock.lock(l, {ttl: 30}, (err, data) => {
		t.is(err, null);
		t.not(data.elapsed, undefined);
		t.not(data.attempts, undefined);

		t.context.lock.lock(l, {timeout: 0.2}, (err, data) => {
			t.not(err, null);
			t.is(err.message, `Error while obtaining lock`);
			t.true(err instanceof error.AcquireError);

			t.context.lock.release(l, err => {
				t.is(err, null);
				t.end();
			});
		});
	});
});
