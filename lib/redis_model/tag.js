var config = require('../../config/redis_config').config;
var redis = require('redis');
var _ = require("underscore");
var Q = require('Q');

var client;

function open() {
	client = redis.createClient(config.port, config.host);
};

function close() {
	client.quit();
};

exports.update = function(tags) {
	var deferred = Q.defer();
	open();
	var current = 0,
		max = tags.length;

	_.each(tags, function(tag) {
		update(tag.name, tag.count).done(function() {
			current++;
			if (current == max) {
				close();
				deferred.resolve();
			}
		});
	});
	return deferred.promise;
}



exports.getAll = function() {
	var deferred = Q.defer();
	open();
	getAll().done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.setWordCount = function(tagName.count) {
	var deferred = Q.defer();
	open();

	setWordCount(tagName, count).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

function create(tagName) {
	var deferred = Q.defer();
	var key = getKey(tagName);
	client.set(key, 0, function(err, result) {
		deferred.resolve(0);
	});
	return deferred.promise;
}

function setWordCount(tagName, count) {
	var deferred = Q.defer();
	var key = getWordCountKey(tagName);
	getWordCount(tagName).done(function(result) {

		if (result != null) {
			count = count + result * 1;
		}
		client.set(key, count, function(err, result) {
			deferred.resolve(count);
		});

	});

	return deferred.promise;
}



function getWordCount(tagName) {
	var deferred = Q.defer();
	var key = getWordCountKey(tagName);
	client.get(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function getKey(tagName) {
	return "tag_" + tagName;
}

function getWordCountKey(tagName) {
	return "tagWordCount_" + tagName;
}

function getAll() {
	var deferred = Q.defer();
	var key = getKey("*");
	client.keys(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function find(tagName) {
	var deferred = Q.defer();
	var key = getKey(tagName);

	client.get(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}



function update(tagName, count) {
	var deferred = Q.defer();

	find_or_create(tagName).done(function(result) {
		if (result != null) {
			var newCount = result * 1 + count;
			updateByTagName(tagName, newCount).done(function(results) {
				deferred.resolve(results);
			});
		}
	});
	return deferred.promise;
}

function updateByTagName(tagName, count) {
	var deferred = Q.defer();
	var key = getKey(tagName);

	client.set(key, count, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function find_or_create(tagName) {
	var deferred = Q.defer();
	var key = getKey(tagName);
	find(tagName).done(function(result) {
		if (result != null) {
			deferred.resolve(result);
		} else {
			create(tagName).done(
				function(result) {
					deferred.resolve(result);
				});
		}
	});
	return deferred.promise;
}