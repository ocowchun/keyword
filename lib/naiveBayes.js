var tagManager = require('./redis_model/tag');
var tagWordManager = require('./redis_model/tag_word');
var Q = require('Q');
var _ = require("underscore");

function getTags() {
	var deferred = Q.defer();
	tagManager.getAll().done(function(tags) {
		deferred.resolve(tags);
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



function getTagProbability(tagName, words) {
	console.log("getTagProbability start:" + tagName);
	var deferred = Q.defer();
	getWordCounts(tagName, words).done(
		function(data) {
			calculateTagProbability(tagName, data).done(function(probability) {
				console.log("getTagProbability done");
				deferred.resolve(probability);
			});

		});

	return deferred.promise;
}

function calculateTagProbability(tagName, data) {
	var deferred = Q.defer();
	var result = 0;

	getTagDocumentCount(tagName).done(function(documentCount) {
		result += Math.log(documentCount);
		getTagWordCountLaplace(tagName).done(function(wordCountLaplace) {
			console.log("wordCountLaplace");
			console.log(wordCountLaplace);
			_.each(data, function(num) {
				result -= Math.log(wordCountLaplace);
				if (num != null && num != 0) {
					console.log(num);
					result += Math.log(num+1);
				}

			});
			deferred.resolve(result);
		});
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

function getTagDocumentCount(tagName) {
	var deferred = Q.defer();
	tagManager.get(tagName).done(function(documentCount) {
		deferred.resolve(documentCount);
	});
	return deferred.promise;
}

function getTagsProbability(tags, words, result, deferred) {
	console.log("getTagsProbability start");
	deferred = deferred || Q.defer();

	if (tags.length == 0) {
		console.log("getTagsProbability done");
		deferred.resolve(result);
	} else {

		var tagName = tags.pop();
		tagName = tagName.replace("tag_", "");
		result = result || [];

		getTagProbability(tagName, words).done(
			function(probaility) {
				result.push({
					tag: tagName,
					probaility: probaility
				});

				getTagsProbability(tags, words, result, deferred);
			});
	}
	return deferred.promise;
}

function classifier(words) {
	console.log(words);
	var deferred = Q.defer();
	getTags().done(function(tags) {
		// tags = ['research-group', 'metrics', 'online-publication', 'foo'];

		getTagsProbability(tags, words).done(function(result) {
			deferred.resolve(result);
		});

	});
	return deferred.promise;
}

var doc = {
	id: '3',
	body: 'As from title. Not all journals provide the impact factor on their homepage. For those who don\'t where can I find their impact factor ?',
	tags: ['journals', 'bibliometrics', 'metrics'],
	wordCounts: {
		As: 1,
		from: 1,
		title: 1,
		Not: 1,
		all: 1,
		journals: 1,
		provide: 1,
		the: 1,
		impact: 2,
		factor: 2,
		on: 1,
		their: 2,
		homepage: 1,
		For: 1,
		those: 1,
		who: 1,
		dont: 1,
		where: 1,
		can: 1,
		I: 1,
		find: 1
	}
};
var words = [];
for (var word in doc.wordCounts) {
	words.push(word);
}
// getTagProbability("bibliometrics", words).done(function(result) {
// 	console.log(result);
// 	console.log("done")
// });
// getTagsProbability(["metrics", "bibliometrics"], words).done(function(result) {
// 	console.log(result);
// 	console.log("fuck fuck");
// });

// getTagProbability("bibliometrics", words).done(function(result) {
// 	console.log(result);
// 	getTagProbability("bibliometrics", words).done(function(result) {
// 		console.log(result);
// 		console.log("done")
// 	});

// });

//calculate three tag's probability
classifier(words).done(function(result) {
	var sg = _.sortBy(result, function(tag) {
		return tag.probaility;
	});
	console.log(sg);
});