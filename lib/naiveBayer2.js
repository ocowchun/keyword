var tagManager = require('./redis_model/tag');
var tagWordManager = require('./redis_model/tag_word');
var tagTitleManager = require('./redis_model/tag_title');
var Q = require('Q');
var _ = require("underscore");
var textUtil = require('./util/text');



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



function getTagProbability(tagName, words, titleWords) {
	var deferred = Q.defer();

	calculateTagProbability(tagName, words, titleWords).done(function(probability) {
		console.log(tagName + " : " + probability);
		deferred.resolve(probability);
	});
	return deferred.promise;
}

var wordCountService = getWordCountService(tagWordManager.findFromTagAndWord, tagManager.getDistinctWord,
	tagManager.getTagWordCount);
var titleWordCountService = getWordCountService(tagTitleManager.findFromTagAndWord, tagManager.getDistinctTitleWord,
	tagManager.getTagTitleWordCount);

// getTagProbability("phd", ["hello", "the", "phd"], []).done(function(r) {
// console.log(r)
// });

function calculateTagProbability(tagName, words, titleWords) {
	var deferred = Q.defer();
	var result = 0;
	getTagDocumentCount(tagName).done(function(documentCount) {
		result += Math.log(documentCount);

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

function getTagsProbability(tags, words,titleWords, result, deferred) {
	deferred = deferred || Q.defer();

	if (tags.length == 0) {
		deferred.resolve(result);
	} else {

		var tagName = tags.pop();
		tagName = tagName.replace("tagu_", "");
		result = result || [];

		getTagProbability(tagName, words, titleWords).done(
			function(probaility) {
				result.push({
					tag: tagName,
					probaility: probaility
				});

				getTagsProbability(tags, words, titleWords, result, deferred);
			});
	}
	return deferred.promise;
}

// parallel
function getTagsProbabilityPar(tags, words, titleWords) {
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

	getTagsProbability(tags1, words, titleWords).done(function(result) {
		var sg = _.sortBy(result, function(tag) {
			return tag.probaility * -1;
		});
		parallelManager.addTagsProbability(sg);
		// deferred.resolve(sg);
	});
	getTagsProbability(tags2, words, titleWords).done(function(result) {
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

	var stopWords = ["This", "a", "by", "those", "be", "are", "for", "at", "the", "in", "is"];
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

function classifier(words, titleWords) {
	words = processWords(words);
	titleWords = titleWords || [];
	titleWords = processWords(titleWords);

	var deferred = Q.defer();
	getTags().done(function(tags) {
		// tags = ['research-group', 'metrics', 'online-publication',
		// 	'foo', 'chemistry', 'new-zealand', 'break-of-study', 'recruiting'
		// ];
		// console.log(tags)
		// tags = ['journals', 'bibliometrics', 'metrics', 'research']
		// tags = ["alarm"];
		getTagsProbabilityPar(tags, words, titleWords).done(function(result) {
			console.log("getTagsProbabilityPar done");
			var sg = _.sortBy(result, function(tag) {
				return tag.probaility; //* -1;
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


var l = '<row Id="1" PostTypeId="1" AcceptedAnswerId="13" CreationDate="2010-09-13T19:16:26.763" Score="162" ViewCount="183528" Body="&lt;p&gt;This is a common question by those who have just rooted their phones.  What apps, ROMs, benefits, etc. do I get from rooting?  What should I be doing now?&lt;/p&gt;&#xA;" OwnerUserId="10" LastEditorUserId="16575" LastEditDate="2013-04-05T15:50:48.133" LastActivityDate="2013-09-03T05:57:21.440" Title="Ive rooted my phone.  Now what?  What do I gain from rooting?" Tags="&lt;rooting&gt;&lt;root&gt;" AnswerCount="2" CommentCount="0" FavoriteCount="112" CommunityOwnedDate="2011-01-25T08:44:10.820" />';

function getQuestion(line) {
	var question = textUtil.parse(line);
	var words = textUtil.bagOfWords(question.body);
	var titleWords = textUtil.bagOfWords(question.title);
	var count = textUtil.wordCount(words);
	var titlWordCount = textUtil.wordCount(titleWords);
	question.wordCounts = count;
	question.titleWordCounts = titlWordCount;
	return question;
}

function exportWordToArray(wordCounts) {
	var words = [];
	for (var word in wordCounts) {
		words.push(word);
	}
	return words;
}

var q = getQuestion(l);
var ws = exportWordToArray(q.wordCounts);
var ts = exportWordToArray(q.titleWordCounts);

// console.log(ws);

classifier(ws,ts);