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
	console.log("getTagProbability start:" + tagName+showCurrentTime());
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
			_.each(data, function(num) {
				result -= Math.log(wordCountLaplace);
				if (num != null && num != 0) {
					result += Math.log(num + 1);
				}

			});
			deferred.resolve(result);
		});
	});


	return deferred.promise;
}

// getTagWordCountLaplace("foo").done(function() {
// console.log("done");
// });

// getTagWordCountLaplace("foo").done(function() {
// console.log("done");
// });

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

// parallel
function getTagsProbabilityPar(tags, words) {
	var deferred = Q.defer();
	var tagAry = slice(tags, 2);
	var tags1 = tagAry[0];
	var tags2 = tagAry[1];

	var parallelManager = {
		tagsLength: 2,
		currentCount: 0,
		tagsProbability: []

	};
	parallelManager.addTagsProbability = function(sg) {

		parallelManager.currentCount += 1;
		parallelManager.tagsProbability = parallelManager.tagsProbability.concat(sg);
		// console.log("addTagsProbability");
		// console.log("parallelManager currentCount" + parallelManager.currentCount + "");

		if (parallelManager.currentCount == parallelManager.tagsLength) {
			deferred.resolve(parallelManager.tagsProbability);
		}

	}

	getTagsProbability(tags1, words).done(function(result) {
		var sg = _.sortBy(result, function(tag) {
			return tag.probaility * -1;
		});
		console.log("getTagsProbability parallel 1");
		parallelManager.addTagsProbability(sg);
		// deferred.resolve(sg);
	});
	getTagsProbability(tags2, words).done(function(result) {
		var sg = _.sortBy(result, function(tag) {
			return tag.probaility * -1;
		});
		console.log("getTagsProbability parallel 2");

		parallelManager.addTagsProbability(sg);
		// deferred.resolve(sg);
	});

	return deferred.promise;
}


//把array拆成幾個小array
function slice(array, num) {
	var result = [];
	_(num).times(function() {
		result.push([]);
	});
	for (var i = 0, max = array.length; i < max; i++) {
		var index = i % num,
			elem = array[i];
		result[index].push(elem);
	}
	return result;
}

function classifier(words) {
	console.log(words);
	var deferred = Q.defer();
	getTags().done(function(tags) {
		tags = ['research-group', 'metrics', 'online-publication',
			'foo', 'chemistry', 'new-zealand', 'break-of-study', 'recruiting'
		];

		getTagsProbabilityPar(tags, words).done(function(result) {
			console.log("getTagsProbabilityPar done");
			var sg = _.sortBy(result, function(tag) {
				return tag.probaility * -1;
			});

			deferred.resolve(sg);
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
exports.classifier = classifier;

// //calculate three tag's probability
classifier(words).done(function(result) {
	// var sg = _.sortBy(result, function(tag) {
	// 	return tag.probaility;
	// });
	// console.log("sg");
	console.log("classifier done");
	console.log(result);
});

function showCurrentTime() {
	var date = new Date()
	return date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() //toTimeString()
}

