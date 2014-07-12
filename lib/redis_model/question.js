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
};

exports.getQuestionCluster = function(question_id) {
	var deferred = Q.defer();
	open();
	getQuestionCluster(question_id).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

exports.setQuestionCluster = function(question_id) {
	var deferred = Q.defer();
	open();
	setQuestionCluster(question_id).done(function(result) {
		close();
		deferred.resolve(result);
	});
	return deferred.promise;
}

function getQuestionKey(question_id) {
	return "doc:" + question_id;
}


function setQuestionCluster(question_id, cluster) {
	var deferred = Q.defer();
	var key = getQuestionKey(question_id);
	client.set(key, val, function(err, result) {
		deferred.resolve(val);
	});
	return deferred.promise;
}


function getQuestionCluster(question_id) {
	var deferred = Q.defer();
	var key = getQuestionKey(question_id);
	client.get(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}