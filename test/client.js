/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
'use strict';

import test from 'ava';
import redis from 'redis';
import sinon from 'sinon';
import Lib from '../src';

test('create client from default configuration', t => {
	const l = new Lib();
	t.pass();
});

test('create client from a string', t => {
	const l = new Lib('redis://127.0.0.1:6379');
	t.pass();
});

test('create client with options {host, port}', t => {
	const opts = {host: '127.0.0.1', port: 6379, database: 1};
	const l = new Lib(opts);
	t.pass();
});

test('throw exception on client auth', t => {
	const client = new redis.createClient();

	const stub = sinon.stub(client, 'auth');
	stub.yields(new Error(`Some Redis Error`));

	const error = t.throws(() => {
		const l = new Lib({
			client: client,
			password: '1337Pa$$w0rd'
		});
	}, Error);

	t.is(error.message, 'Some Redis Error');
	stub.restore();
});

test('throws on client wrong database passing', t => {
	const client = new redis.createClient();

	const stub = sinon.stub(client, 'select');
	stub.yields(new Error(`Some Redis Database Error`));

	const error = t.throws(() => {
		const l = new Lib({
			client: client,
			database: 'wrong_database'
		});
	}, Error);

	t.is(error.message, 'Some Redis Database Error');
	stub.restore();
});
