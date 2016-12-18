# Ordo - Redis distributed lock system
> Ordo - is a latin word Queue, that's what this library looks like. Concurrent access!

[![Build Status](https://travis-ci.org/m1ome/ordo.svg?branch=master)](https://travis-ci.org/m1ome/ordo)
[![dependencies Status](https://david-dm.org/m1ome/ordo/status.svg)](https://david-dm.org/m1ome/ordo)
[![Coverage Status](https://coveralls.io/repos/github/m1ome/ordo/badge.svg)](https://coveralls.io/github/m1ome/ordo)
[![Code Climate](https://codeclimate.com/github/m1ome/ordo/badges/gpa.svg)](https://codeclimate.com/github/m1ome/ordo)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

# Installation
Use npm to install:
```bash
npm install --save ordo
```

# Usage
For basic example try to look at `/examples` directory.

## Defaults
- **TTL** - 10 seconds
- **Timeout** - 10 seconds
- **Delay** - 25 Ms

## Basic
```javascript
const Ordo = require('ordo');

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
```

## Callback/Promise style
```javascript
const Ordo = require('ordo');
const lock = new Ordo();

// You can use this library in Promise-way
lock.lock('user#1').then(info => {
    console.log(info);
});

// You can use library in callback-way style
lock.lock('user#1', (err, info) => {
    console.log(info);
});
```

## Options
You also can use options to have some client customizations:
- **port** - Redis port (Default: 6379)
- **host** - Redis host (Default: localhost)
- **client** - Custom Redis client (You should use `redis` package for it)
- **password** - Auth password
- **database** - Redis database
- **prefix** - Custom prefix (Default: `ordo:lock:`)

Also you can use `redis-uri` to connect in e.g.:
```javascript
const Ordo = require('ordo');

const lock = new Ordo('redis://locahost:6379');
```

## TTL/Timeout
**TTL** - Time lock will live in Redis  
**Timeout** - When trying to set lock library reach this timeout Exception will be thrown
**Delay** - Default delay between lock attempts

You can customize lock acquire with *ttl*, *timeout* and *delay* options:
```javascript
const Ordo = require('Ordo');

const lock = new Ordo();
// This lock will have TTL 1 second and will try to be acquired in 1.5 second
// with a 500 ms delay between attempts .
lock.lock('user#1', {ttl: 1, timeout: 1.5, delay: 500}).then(info => {
    console.log(info.attempts); // Attempts to acquire lock
    console.log(info.elapsed); // Elapsed time in MS to acquire lock
});
```

## Errors/Exceptions
There is three type of errors can be thrown by this library:
- **RedisError** - this error thrown on every redis error.
- **AcquireError** - this error thrown when we failed to acquire lock in requested `timeout`
- **ReleaseError** - this error thrown when we try to release unknown/expired lock

# Debugging
For debugging reasons **Ordo** uses [debug](https://github.com/visionmedia/debug) library.
To enable debugging just use `DEBUG` env variable with value: `ordo`, in e.g.:
```bash
DEBUG=ordo node index.js
```

# License
MIT License

Copyright (c) 2016 Pavel Makarenko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
