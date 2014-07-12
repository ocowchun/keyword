var tagManager = require('./redis_model/tag');
var tagWordManager = require('./redis_model/tag_word');
var tagTitleManager = require('./redis_model/tag_title');
var Q = require('Q');
var _ = require("underscore");



function getTags() {
	var deferred = Q.defer();
	tagManager.getAllTags().done(function(tags) {
		deferred.resolve(tags);
	});
	return deferred.promise;
}



function getWordCountService(findFromTagAndWord, getDistinctWord, getTagWordCount) {
	var service = {
		findFromTagAndWord: findFromTagAndWord,
		getDistinctWord: getDistinctWord,
		getTagWordCount: getTagWordCount
	};

	service.getWordCounts = function(tagName, words) {
		var deferred = Q.defer();
		service.findFromTagAndWord(tagName, words).done(function(result) {
			deferred.resolve(result);
		});
		return deferred.promise;
	};

	//titlewordcount+v TODO!!!!!!!
	service.getTagWordCountLaplace = function(tagName) {
		var deferred = Q.defer();
		var result = 0;
		service.getTagWordCount(tagName).done(function(wordCount) {
			result += wordCount * 1;
			service.getDistinctWord(tagName).done(function(distinctWord) {
				var distinctWordLength = distinctWord * 1;
				result += distinctWordLength;
				deferred.resolve(result);
			});
		});
		return deferred.promise;
	};

	service.calculate = function(tag, words) {
		var deferred = Q.defer();
		service.getWordCounts(tag, words).done(function(data) {
			service.getTagWordCountLaplace(tag).done(function(wordCountLaplace) {
				var result = 0;
				_.each(data, function(num) {
					result -= Math.log(wordCountLaplace);

					if (num != null && num != 0) {
						var word_score = Math.log(Math.pow(num * 1 + 1, 2));
						result += word_score;

					}

				});
				deferred.resolve(result);
			});
		});
		return deferred.promise;

	}

	return service.calculate;
}



function getTagProbability(tagName, words,titleWords) {
	var deferred = Q.defer();
	calculateTagProbability(tagName, words, titleWords).done(function(probability) {
		deferred.resolve(probability);
	});
	return deferred.promise;
}

var wordCountService = getWordCountService(tagWordManager.findFromTagAndWord, tagManager.getDistinctWord,
	tagManager.getTagWordCount);
var titleWordCountService = getWordCountService(tagTitleManager.findFromTagAndWord, tagManager.getDistinctWord,
	tagManager.getTagWordCount);

// getTagProbability("phd", ["hello", "the", "phd"], []).done(function(r) {
// console.log(r)
// });

function calculateTagProbability(tagName, words, titleWords) {
	var deferred = Q.defer();
	var result = 0;

	getTagDocumentCount(tagName).done(function(documentCount) {
		result += Math.log(documentCount);
		console.log(result)
		wordCountService(tagName, words).done(function(wordResult) {
			result += wordResult;
			titleWordCountService(tagName, titleWords).done(function(titleResult) {
				result += titleResult;
				deferred.resolve(result);
			});
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
	deferred = deferred || Q.defer();

	if (tags.length == 0) {
		deferred.resolve(result);
	} else {

		var tagName = tags.pop();
		tagName = tagName.replace("tagu_", "");
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

		if (parallelManager.currentCount == parallelManager.tagsLength) {
			deferred.resolve(parallelManager.tagsProbability);
		}

	}

	getTagsProbability(tags1, words).done(function(result) {
		var sg = _.sortBy(result, function(tag) {
			return tag.probaility * -1;
		});
		parallelManager.addTagsProbability(sg);
		// deferred.resolve(sg);
	});
	getTagsProbability(tags2, words).done(function(result) {
		var sg = _.sortBy(result, function(tag) {
			return tag.probaility * -1;
		});

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

function removeStopWords(words) {
	var stopWords = ["are", "for", "at", "the", "in", "is"];
	var args = [words].concat(stopWords);
	return _.without.apply(null, args);
}

function lowerWords(words) {
	return _.map(words, function(word) {
		return word.toLowerCase();
	});
}

//對進來的word進行前處理
function processWords(words) {
	words = removeStopWords(words);
	words = lowerWords(words)
	return words;
}

function classifier(words) {
	words = processWords(words);

	var deferred = Q.defer();
	getTags().done(function(tags) {
		// tags = ['research-group', 'metrics', 'online-publication',
		// 	'foo', 'chemistry', 'new-zealand', 'break-of-study', 'recruiting'
		// ];
		// console.log(tags)
		// tags = ['journals', 'bibliometrics', 'metrics', 'research']

		getTagsProbabilityPar(tags, words).done(function(result) {
			console.log("getTagsProbabilityPar done");
			var sg = _.sortBy(result, function(tag) {
				return tag.probaility * -1;
			});

			console.log(sg);
			deferred.resolve(sg);
		});

	});
	return deferred.promise;
}



exports.classifier = classifier;



function showCurrentTime() {
	var date = new Date()
	return date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() //toTimeString()
}