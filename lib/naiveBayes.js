var tagManager = require('./redis_model/tag');
var tagWordManager = require('./redis_model/tag_word');
var Q = require('Q');
var _ = require("underscore");

function getTags() {
	var deferred = Q.defer();
	tagManager.getAll().done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}


function getWordCounts(tagName, words) {
	var deferred = Q.defer();
	tagWordManager.findFromTagAndWord(tagName, words).done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

getTagProbability("data", ["over", "hope", "heard"]).done(function(result) {
	console.log(result);
});



function getTagProbability(tagName, words) {
	var deferred = Q.defer();
	getWordCounts(tagName, words).done(
		function(data) {
			var result = calculateTagProbability(tagName, data);
			deferred.resolve(result);
		});

	return deferred.promise;
}

function calculateTagProbability(tagName, data) {
	var deferred = Q.defer();
	var result = 0;

	getTagWordCountLaplace(tagName).done(function(wordCountLaplace) {
		_.each(data, function(num) {
			result -= Math.log(wordCountLaplace);
			if (num != null && num != 0) {
				result += Math.log(num);
			}

		});
		deferred.resolve(result);
	});

	return deferred.promise;
}

//wordcount+v
function getTagWordCountLaplace(tagName) {
	var deferred = Q.defer();
	var result = 0;
	tagManager.getWordCount(tagName).done(function(wordCount) {
		result += wordCount * 1;
		tagWordManager.getCountFromTag(tagName).done(function(distinctWord) {
			var distinctWordLength = distinctWord.length;
			result += distinctWordLength;
			deferred.resolve(result);
		});
	});
	return deferred.promise;
}

function getTagsProbability(tags, words) {
	result = [];
	_.each(tags, function(tagName) {
		var pro = getTagProbability(tagName, words).done(
			function(result) {
				result.push({
					tag: tagName,
					probaility: pro
				});
			});

	});
	return result;
}

function calculate(tagName, getWords) {
	getTags().done(function(result) {


	});
}