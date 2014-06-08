var tagManager = require('./redis_model/tag');
var tagWordManager = require('./memory_model/tag_word');
var Q = require('Q');
var _ = require("underscore");

var currentIOTime = 0;

function addIOTIme(start, end) {
	var time = end - start;
	currentIOTime += time;
}

function getTags() {
	var deferred = Q.defer();
	var start = new Date();
	tagManager.getAll().done(function(tags) {
		var end = new Date();
		addIOTIme(start, end);
		console.log(currentIOTime);
		deferred.resolve(tags);
	});
	return deferred.promise;
}


function getWordCounts(tagName, words) {
	var deferred = Q.defer();
	var start = new Date();
	tagWordManager.findFromTagAndWord(tagName, words).done(function(result) {
		var end = new Date();
		addIOTIme(start, end);
		deferred.resolve(result);
	});
	return deferred.promise;
}



function getTagProbability(tagName, words) {
	console.log("getTagProbability start:" + tagName + showCurrentTime());
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


//wordcount+v
function getTagWordCountLaplace(tagName) {
	var deferred = Q.defer();
	var result = 0;
	var start = new Date();
	tagManager.getWordCount(tagName).done(function(wordCount) {
		var end = new Date();
		addIOTIme(start, end);
		result += wordCount * 1;

		var start1 = new Date();
		console.log("tagWordManager start")
		console.log(start1.getMilliseconds());
		tagWordManager.getCountFromTag(tagName).done(function(distinctWord) {
			var end1 = new Date();
			console.log("tagWordManager end")
			console.log(end1.getMilliseconds());
			addIOTIme(start1, end1);
			var distinctWordLength = distinctWord.length;
			result += distinctWordLength;
			deferred.resolve(result);
		});
	});
	return deferred.promise;
}

function getTagDocumentCount(tagName) {
	var deferred = Q.defer();
	var start = new Date();
	tagManager.get(tagName).done(function(documentCount) {
		var end = new Date();
		addIOTIme(start, end);
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
	var parallelCount = 3;
	var tagAry = slice(tags, parallelCount);
	var tags1 = tagAry[0];
	var tags2 = tagAry[1];
	var tags3 = tagAry[2];
	var parallelManager = {
		tagsLength: parallelCount,
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

	getTagsProbability(tags3, words).done(function(result) {
		var sg = _.sortBy(result, function(tag) {
			return tag.probaility * -1;
		});
		console.log("getTagsProbability parallel 3");

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
		// tags = ['research-group', 'metrics', 'online-publication',
		// 	'foo', 'chemistry', 'new-zealand', 'break-of-study', 'recruiting'
		// ];

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

exports.classifier = classifier;
var start = new Date();
// //calculate three tag's probability

// classifier(words).done(function(result) {
// 	// var sg = _.sortBy(result, function(tag) {
// 	// 	return tag.probaility;
// 	// });
// 	// console.log("sg");
// 	var end = new Date()
// 	console.log("classifier done");
// 	console.log(currentIOTime);
// 	console.log(end - start);
// });



function showCurrentTime() {
	var date = new Date()
	return date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() //toTimeString()
}