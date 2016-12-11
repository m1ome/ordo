'use strict';

const Lib = require('../src');
const redis = require('redis');

describe('Client', () => {
	it('create a client from a default configuration', () => {
		const lock = new Lib();
	});

	it('create a client from a string', () => {
		const lock = new Lib('redis://127.0.0.1:6379');
	});

	it('create a client with provided host/port', () => {
		const lock = new Lib({
			host: '127.0.0.1',
			port: 6379,
			database: 1
		});
	});

	it('create a client with a client option provided', () => {
		const client = new redis.createClient();
		const lock = new Lib({
			client: client
		});
	});

	it('should throw on client Auth', () => {
		const client = new redis.createClient();

		spyOn(client, 'auth').and.callFake(function(password, cb) {
			return cb(new Error(`Some Redis Error`));
		});

		expect(() => {
			const lock = new Lib({
				client: client,
				password: '1337Pa$$w0rd'
			});
		}).toThrow(new Error(`Some Redis Error`));
	});

	it('should throw on client Database', () => {
		const client = new redis.createClient();

		spyOn(client, 'select').and.callFake(function(database, cb) {
			return cb(new Error(`Some Redis Error`));
		});

		expect(() => {
			const lock = new Lib({
				client: client,
				database: '100500'
			});
		}).toThrow(new Error(`Some Redis Error`));
	});
});
