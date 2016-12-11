'use strict';

const Ordo = require('../src');

const lock = new Ordo();

lock
.lock('user')
.then(() => {
	console.log('Obtained lock #1');

	setTimeout(() => {
		lock
		.release('user')
		.then(() => {
			console.log('Released lock #1');
		});
	}, 1000);
});

lock
.lock('user')
.then(() => {
	console.log('Obtained lock #2');

	return lock.release('user');
})
.then(() => {
	console.log('Released lock #2');
});
