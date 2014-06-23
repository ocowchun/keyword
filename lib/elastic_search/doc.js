var elasticsearch = require('elasticsearch');
var config = require('../../config/elastic_search_config').config;
var _ = require("underscore");
var Q = require('Q');

var client = new elasticsearch.Client(config);


exports.get = function(doc_id) {
	return getDoc(doc_id);
}

exports.create = function(question) {
	return createDoc(question);
}


function getDoc(doc_id) {
	var deferred = Q.defer();

	client.get({
		index: 'stackexchange',
		type: 'question',
		id: doc_id
	}, function(error, response) {
		deferred.resolve(response);
	});
	return deferred.promise;

}

function createDoc(question) {
	var deferred = Q.defer();
	client.create({
		index: 'stackexchange',
		type: 'question',
		id: question.id,
		body: {
			title: question.title,
			tags: question.tags,
			body: question.body
		}
	}, function(error, response) {
		deferred.resolve(response);
	});
	return deferred.promise;
}


function deleteDoc() {
	client.delete({
		index: 'stackexchange',
		type: 'question',
		id: '2'
	}, function(error, response) {
		// ...
	});
}

