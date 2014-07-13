var _ = require('underscore');
var tagManager = require('../lib/redis_model/tag');
var tagWordManager = require('../lib/redis_model/tag_word');
var tagTitleManager = require('../lib/redis_model/tag_title');
var docManager = require('../lib/models/doc');
var docStorage = require('../lib/elastic_search/doc');
var readData = require('./readData');

var Q = require('q');

readData.excute(processData);


function processData(questions) {
	console.log(questions.length);
	console.log("updateQuestions start")
	//store tf idf
	updateQuestions(questions)

	// storeQuestions(questions)

}



function storeQuestions(questions) {
	if (questions.length > 0) {
		var question = questions.pop();
		console.log("store questione: " + question.id);
		docStorage.create(question).then(
			function() {
				storeQuestions(questions);
			});
	} else {
		console.log("store questions done!");
	}
}


function updateQuestions(questions) {
	if (questions.length > 0) {
		var question = questions.pop();
		// console.log("update id:" + question.id);
		updateItem(question).then(
			function() {
				// console.log("fuck");
				// console.log(questions.length);
				updateQuestions(questions);
			});
	}
}



function getTotalWordCount(wordCounts) {
	var sum = 0;
	for (var word in wordCounts) {
		var count = wordCounts[word];
		sum += count;
	}
	return sum;
}



//把問題的資料丟到db
function updateItem(question) {
	console.log("updateItem start:" + question.id);
	var deferred = Q.defer();
	updateTags(question.tags).then(function() {
		updateTitleAndWord(question).done(function() {
			deferred.resolve();
		});
	})
	return deferred.promise;
}

//更新tag的文章出現數
function updateTags(tagStrs) {
	var deferred = Q.defer();
	var tags = [];
	_.each(tagStrs, function(tag) {
		tags.push({
			name: tag,
			count: 1
		});

	});

	if (tags.length > 0) {
		tagManager.setManys(tags).done(function() {
			console.log("updateTags done");
			deferred.resolve();
		});
	} else {
		console.log("updateTags done");
		deferred.resolve();
	}

	return deferred.promise;
}

function updateWordDoc(wordCounts) {
	var words = [];
	for (word in wordCounts) {
		words.push(word);
	}
	return docManager.incrDocs(words);
}

function updateTitleAndWord(question) {

	// var deferred = Q.defer();
	// updateTagTitleAndWord(question).then(function() {
	// 	updateWordDoc(question.wordCounts).done(function() {
	// 		deferred.resolve();

	// 	});
	// });

	// return deferred.promise;
	updateWordDoc(question.wordCounts)
	return updateTagTitleAndWord(question);
}

function updateTagTitleAndWord(question) {
	var deferred = Q.defer();
	updateTagTitleWords(question.titleWordCounts, question.tags).done(function() {
		updateTagWords(question.wordCounts, question.tags).then(function() {
			deferred.resolve();
		});
	});

	return deferred.promise;
}

var updateTagWordService = getStoreService(tagWordManager.findFromTagAndWord, tagManager.setDistinctWord,
	tagWordManager.setMany);

var updateTagTitleWordService = getStoreService(tagTitleManager.findFromTagAndWord, tagManager.setDistinctTitleWord,
	tagTitleManager.setMany);

//更新tagWord,tagDistinctWord
function updateTagWords(wordCounts, tagNames) {
	var deferred = Q.defer();

	updateTagWordService(wordCounts, tagNames).done(function() {
		deferred.resolve();
	});
	return deferred.promise;
}

//更新tagTitleWord,tagDistinctTitleWord
function updateTagTitleWords(wordCounts, tagNames) {
	var deferred = Q.defer();
	updateTagTitleWordService(wordCounts, tagNames).done(function() {
		deferred.resolve();
	});
	return deferred.promise;
}

function getStoreService(findFromTagAndWord, setDistinctWord, setMany) {
	var service = {
		findFromTagAndWord: findFromTagAndWord,
		setDistinctWord: setDistinctWord,
		setMany: setMany
	};
	service.updateTagWords = function(wordCounts, tagNames) {

		var deferred = Q.defer();
		var words = convertAttributesToArray(wordCounts);
		service.updateDistinctTagWords(_.clone(tagNames), words).done(function() {

			service.updateAllTagWords(wordCounts, _.clone(tagNames)).done(function() {
				deferred.resolve();
			});

		});

		return deferred.promise;
	}

	service.updateDistinctTagWords = function(tagNames, words, deferred) {
		deferred = deferred || Q.defer();
		if (tagNames.length > 0) {
			var tagName = tagNames.pop();
			service.updateDistinctTagWord(tagName, words).done(function() {
				service.updateDistinctTagWords(tagNames, words, deferred);
			});
		} else {
			deferred.resolve();
		}
		return deferred.promise;
	}

	service.updateDistinctTagWord = function(tagName, words) {
		var deferred = Q.defer();
		service.findFromTagAndWord(tagName, words).done(function(wordCounts) {
			var datas = _.zip(words, wordCounts)
			var newWords = _.filter(datas, function(data) {
				return data[1] == null
			})
			service.setDistinctWord(tagName, newWords.length).done(function() {
				deferred.resolve();
			});
		});
		return deferred.promise;
	}

	service.updateAllTagWords = function(wordCounts, tagNames, deferred) {
		deferred = deferred || Q.defer();
		if (tagNames.length > 0) {
			var tagName = tagNames.pop();
			service.updateOneTagWords(wordCounts, tagName).done(
				function() {
					service.updateAllTagWords(wordCounts, tagNames, deferred);
				});
		} else {
			deferred.resolve();
		}
		return deferred.promise;
	}

	service.updateOneTagWords = function(words, tagName) {

		var wordCounts = [];
		for (var word in words) {
			var count = words[word];
			var wordCount = {
				word: word,
				count: count
			};
			wordCounts.push(wordCount);
		}

		return service.setMany(tagName, wordCounts);
	}

	return service.updateTagWords;
}


//將屬性轉成array
function convertAttributesToArray(obj) {
	var attrs = [];
	for (var atr in obj) {
		attrs.push(atr);
	}
	return attrs;
}


// updateTagWordCount();

// tagManager.setTagWordCount("test", "0");

function updateTagWordCount() {

	tagManager.getAllTags().done(function(tags) {
		saveTagWordCounts(tags);
	});
}

function saveTagWordCounts(tags) {
	if (tags.length > 0) {
		var tag = tags.pop();
		saveTagWordCount(tag).then(
			function() {
				saveTagWordCounts(tags);
			});
	}
}

function saveTagWordCount(tag) {
	var deferred = Q.defer();
	aggregateTagWordCount(tag).done(function(count) {
		tagManager.setTagTitleWordCount(tag, count).done(function() {
			console.log("done");
			deferred.resolve();
		});

	});
	return deferred.promise;
}

function aggregateTagWordCount(tag) {
	var deferred = Q.defer();
	tagTitleManager.getTagWords(tag).done(function(result) {
		var sum = _.reduce(result, function(x, y) {
			return x * 1 + y * 1;
		}, 0);
		deferred.resolve(sum);
	});
	return deferred.promise;
}