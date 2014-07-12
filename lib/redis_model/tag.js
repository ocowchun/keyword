var config = require('../../config/redis_config').config;
var redis = require('redis');
var _ = require("underscore");
var Q = require('q');

var client;
var currentConnect = 0;

function open() {
	if (currentConnect == 0) {
		client = redis.createClient(config.port, config.host);
	}
	currentConnect++;
}

function close() {
	currentConnect--;
	if (currentConnect == 0) {
		client.quit();
		// console.log("close")

	}
	// console.log(client);
};


//更新tag出現次數
exports.setManys = function(tags) {
	var deferred = Q.defer();
	open();
	var current = 0,
		max = tags.length;

	_.each(tags, function(tag) {
		setTag(tag.name, tag.count).done(function() {
			current++;
			if (current == max) {
				close();
				deferred.resolve();
			}
		});
	});
	return deferred.promise;
}

exports.getAllTags = function() {
	var deferred = Q.defer();
	open();
	getAllTags().done(function(result) {
		close();
		var tags = _.map(result, function(tag) {
			return tag.replace("tag_", "");
		});
		deferred.resolve(tags);
	});
	return deferred.promise;
}

exports.setDistinctWord = function(tagName, count) {
	var deferred = Q.defer();
	open();
	setDistinctWord(tagName, count).done(function(result) {
		close();
		deferred.resolve();
	});


	return deferred.promise;
}

exports.setTagWordCount = function(tagName, count) {
	var deferred = Q.defer();
	open();
	setTagWordCount(tagName, count).done(function(result) {
		close();
		deferred.resolve();
	});


	return deferred.promise;
}


exports.setDistinctTitleWord = function(tagName, count) {
	var deferred = Q.defer();
	open();
	setDistinctTitleWord(tagName, count).done(function(result) {
		close();
		deferred.resolve();
	});
	return deferred.promise;
}

exports.setTagTitleWordCount = function(tagName, count) {
	var deferred = Q.defer();
	open();
	setTagTitleWordCount(tagName, count).done(function(result) {
		close();
		deferred.resolve();
	});
	return deferred.promise;
}

exports.get = function(tagName) {
	var deferred = Q.defer();
	open();
	var key = getTagKey(tagName)
	getValue(key).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.getDistinctWord = function(tagName) {
	var deferred = Q.defer();
	open();
	var key = getDistinctWordKey(tagName)
	getValue(key).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.getDistinctTitleWord = function(tagName) {
	var deferred = Q.defer();
	open();
	var key = getDistinctTitleWordKey(tagName)
	getValue(key).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.getTagWordCount = function(tagName) {
	var deferred = Q.defer();
	open();
	var key = getTagWordCountKey(tagName)
	getValue(key).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.getTagTitleWordCount = function(tagName) {
	var deferred = Q.defer();
	open();
	var key = getTagTitleWordCountKey(tagName)
	getValue(key).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

//更新tag的出現次數
function setTag(tagName, count) {
	var deferred = Q.defer();
	var key = getTagKey(tagName);
	setValue(key, count).done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function setDistinctWord(tagName, count) {
	var deferred = Q.defer();
	var key = getDistinctWordKey(tagName);
	setValue(key, count).done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function setTagWordCount(tagName, count) {
	var deferred = Q.defer();
	var key = getTagWordCountKey(tagName);
	setValue(key, count).done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function setDistinctTitleWord(tagName, count) {
	var deferred = Q.defer();
	var key = getDistinctTitleWordKey(tagName);
	setValue(key, count).done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function setTagTitleWordCount(tagName, count) {
	var deferred = Q.defer();
	var key = getTagTitleWordCountKey(tagName);
	setValue(key, count).done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function setValue(key, val) {
	var deferred = Q.defer();
	getValue(key).done(function(result) {

		if (result != null) {
			val = val + result * 1;
		}
		client.set(key, val, function(err, result) {
			deferred.resolve(val);
		});

	});

	return deferred.promise;
}

function getValue(key) {
	var deferred = Q.defer();
	client.get(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function getTagKey(tagName) {
	return "tag_" + tagName;
}

function getDistinctWordKey(tagName) {
	return "tagDistinctWord_" + tagName;
}

function getDistinctTitleWordKey(tagName) {
	return "tagDistinctTitleWord_" + tagName;
}

function getTagWordCountKey(tag) {
	return "tagWordCount_" + tag;
}

function getTagTitleWordCountKey(tag) {
	return "tagTitleWordCount_" + tag;
}

function getAllTags() {
	var deferred = Q.defer();
	var key = getTagKey("*");
	client.keys(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}