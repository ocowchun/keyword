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
	}
}

exports.quit = function() {
	client.quit();
}

exports.setMany = function(tag, wordCounts) {
	var deferred = Q.defer();
	open();
	var current = 0,
		max = wordCounts.length;

	_.each(wordCounts, function(wordCount) {
		setTagWord(tag, wordCount).done(function() {
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
	findFromTagAndWord(tagName, words).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

//取得屬於tag的全部word
exports.getTagWords = function(tagName) {
	var deferred = Q.defer();
	open();
	getTagWords(tagName).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}


function findFromTagAndWord(tagName, words) {
	var deferred = Q.defer();
	var keys = getKeys(tagName, words);
	client.mget(keys, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}


function getTagWordKey(tagName, word) {
	return "tagTitleWord_" + tagName + "_" + word;
}

function getKeys(tagName, words) {
	return _.map(words, function(word) {
		return getTagWordKey(tagName, word);
	});
}

function getTagWords(tagName) {
	var deferred = Q.defer();

	listAllTagWord(tagName).done(function(keys) {
		client.mget(keys, function(err, result) {
			deferred.resolve(result);
		});
	});

	return deferred.promise;
}

function listAllTagWord(tagName) {
	var deferred = Q.defer();
	var key = getTagWordKey(tagName, "*");
	client.keys(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}


//更新tagWord的出現次數
function setTagWord(tagName, wordCount) {
	var deferred = Q.defer();
	var count = wordCount.count;
	var word = wordCount.word;
	var key = getTagWordKey(tagName, word);
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