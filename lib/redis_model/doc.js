var config = require('../../config/redis_config').config;
var redis = require('redis');
var _ = require("underscore");
var Q = require('Q');

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

exports.incrDoc = function(word) {
	var deferred = Q.defer();
	open();
	incrDoc(word).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.getDoc = function(word) {
	var deferred = Q.defer();
	open();
	getDoc(word).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.incrDocs = function(words) {
	open();
	incrDocs(words)
	close();

}
exports.getDocs = function(words) {
	var deferred = Q.defer();
	open();
	getDocs(words).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

function getDocKey(word) {
	return "doc:" + word;
}

function incrDoc(word) {
	var key = getDocKey(word);
	client.incr(key)
}

function incrDocs(words) {
	_.each(words, function(word) {
		incrDoc(word);
	});
}


function getDoc(word) {
	var deferred = Q.defer();
	var key = getDocKey(word);
	client.get(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

function getDocs(words) {
	var deferred = Q.defer();
	var keys = getKeys(words);
	client.mget(keys, function(err, strs) {
		result = _.map(strs, function(str) {
			return str * 1;
		});
		deferred.resolve(result);
	});
	return deferred.promise;

}

function getKeys(words) {
	return _.map(words, function(word) {
		return getDocKey(word)
	});
}