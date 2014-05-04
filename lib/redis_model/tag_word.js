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


exports.update = function(tag_words) {
	var deferred = Q.defer();
	open();
	var current = 0,
		max = tag_words.length;

	_.each(tag_words, function(word) {
		update(word).done(function() {
			current++;
			if (current == max) {
				close();
				deferred.resolve();
			}
		});
	});
	return deferred.promise;
}

exports.findFromTagAndWord = function(tagName, words) {
	var deferred = Q.defer();
	open();
	getAll(tagName, words).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

//回傳一共有幾個不同的word出現在指定tagName
exports.getCountFromTag = function(tagName) {
	var deferred = Q.defer();
	open();
	var tagName = "metrics";
	listAllTagWord(tagName).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

function getKey(tagName, word) {
	return "tagword_" + tagName + "_" + word;
}

function getKeys(tagName, words) {
	return _.map(words, function(word) {
		return getKey(tagName, word);
	});
}

function getAll(tagName, words) {
	var deferred = Q.defer();
	var keys = getKeys(tagName, words);
	client.mget(keys, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}


function update(word) {
	var deferred = Q.defer();
	var content = word.content,
		tagName = word.tag_name,
		count = word.count;
	find_or_create(tagName, content).done(function(result) {
		if (result != null) {
			var newCount = result * 1 + count;
			updateByTagName(tagName, content, newCount).done(function(result) {
				deferred.resolve(result);
			});
		}
	});
	return deferred.promise;
}

function updateByTagName(tagName, word, count) {
	var deferred = Q.defer();
	var key = getKey(tagName, word);
	client.set(key, count, function(err, result) {
		deferred.resolve(result);
	});

	return deferred.promise;
}



function listAllTagWord(tagName) {
	var deferred = Q.defer();
	var key = getKey(tagName, "*");
	client.keys(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function find_or_create(tagName, word) {
	var deferred = Q.defer();
	find(tagName, word).done(function(result) {
		if (result != null) {
			deferred.resolve(result);
		} else {
			create(tagName, word).done(
				function(result) {
					deferred.resolve(result);
				});
		}
	});
	return deferred.promise;
}



function create(tagName, word) {
	var deferred = Q.defer();
	var key = getKey(tagName, word);
	client.set(key, 0, function(err, result) {
		deferred.resolve(0);
	});
	return deferred.promise;
}

function find(tagName, word) {
	var deferred = Q.defer();
	var key = getKey(tagName, word);

	client.get(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}