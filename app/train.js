var _ = require('underscore');
var body = "&lt;p&gt;As from title. What kind of visa class do I have to apply for, in order to work as an academic in Japan ? &lt;/p&gt;&#xA;";
var tagManager = require('../lib/redis_model/tag');
var tagWordManager = require('../lib/redis_model/tag_word');
var tagTitleManager = require('../lib/redis_model/tag_title');
var docManager = require('../lib/models/doc');
var docStorage = require('../lib/elastic_search/doc');

var Q = require('Q');

function getTextFromHtml(body) {
	var validHTMLTags = /^(?:a|abbr|acronym|address|applet|area|article|aside|audio|b|base|basefont|bdi|bdo|bgsound|big|blink|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|isindex|kbd|keygen|label|legend|li|link|listing|main|map|mark|marquee|menu|menuitem|meta|meter|nav|nobr|noframes|noscript|object|ol|optgroup|option|output|p|param|plaintext|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|spacer|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)$/i;
	var reLt = new RegExp('&lt;', 'g');
	body = body.replace(reLt, '<');
	var reGt = new RegExp('&gt;', 'g');
	body = body.replace(reGt, '>');
	var reFuck = new RegExp('&#xA;', 'g');
	body = body.replace(reFuck, '');

	var text = body.replace(/<\/?(a|abbr|acronym|address|applet|area|article|aside|audio|b|base|basefont|bdi|bdo|bgsound|big|blink|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|isindex|kbd|keygen|label|legend|li|link|listing|main|map|mark|marquee|menu|menuitem|meta|meter|nav|nobr|noframes|noscript|object|ol|optgroup|option|output|p|param|plaintext|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|spacer|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)\b[^<>]*>/g, "")
	return text;
}


var row = ' <row Id="1" PostTypeId="1" AcceptedAnswerId="180" CreationDate="2012-02-14T20:23:40.127" Score="12" ViewCount="130" Body="&lt;p&gt;As from title. What kind of visa class do I have to apply for, in order to work as an academic in Japan ? &lt;/p&gt;&#xA;" OwnerUserId="5" LastEditorUserId="2700" LastEditDate="2013-10-30T09:14:11.633" LastActivityDate="2013-10-30T09:14:11.633" Title="What kind of Visa is required to work in Academia in Japan?" Tags="&lt;hiring&gt;&lt;visa&gt;&lt;japan&gt;" AnswerCount="1" CommentCount="1" FavoriteCount="1" />';


function parse(row) {
	var question = {};
	question.id = getId(row);
	question.body = getBody(row);
	question.tags = getTags(row);
	question.title = getTitle(row);
	return question;
}


function getId(row) {
	var idStart = row.indexOf('Id="') + 4;
	var idEnd = row.indexOf('"', idStart);
	var id = row.substring(idStart, idEnd);
	return id;

}

function getTitle(row) {
	var bodyStart = row.indexOf('Title="') + 7;
	var bodyEnd = row.indexOf('"', bodyStart);
	var body = row.substring(bodyStart, bodyEnd);
	body = getTextFromHtml(body);
	return body;
}

function getBody(row) {
	var bodyStart = row.indexOf('Body="') + 6;
	var bodyEnd = row.indexOf('"', bodyStart);
	var body = row.substring(bodyStart, bodyEnd);
	body = getTextFromHtml(body);
	return body;
}


function getTags(row) {
	var start = row.indexOf('Tags="') + 6;
	var end = row.indexOf('"', start);
	var tags = row.substring(start, end);
	var reLt = new RegExp('&lt;', 'g');
	tags = tags.replace(reLt, '');
	var reGt = new RegExp('&gt;', 'g');
	tags = tags.replace(reGt, ',');
	tags = tags.split(",");
	tags.pop();
	return tags;
}

function bagOfWords(text) {
	var outString = text.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
	var words = outString.split(' ');
	words = _.filter(words, function(word) {
		return word != '';
	});
	words = _.map(words, function(word) {
		return word.toLowerCase();
	})
	return words;
}

function wordCount(words) {
	var result = _.countBy(words, function(word) {
		return word;
	});
	return result;
}


var _ = require('underscore')
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

// var csvFileName = "../academia.stackexchange.com/Posts.xml";
var csvFileName = "../datas/stackexchange/android.stackexchange/Posts.xml";



var instream = fs.createReadStream(csvFileName);
var outstream = new stream;
var rl = readline.createInterface(instream, outstream);


var fileContent = "";
var lineCount = 0;
var questions = [];

rl.on('line', function(line) {

	if (lineCount >=3) {
		var question = parse(line);
		var words = bagOfWords(question.body);
		var titleWords = bagOfWords(question.title);
		var count = wordCount(words);
		var titlWordCount = wordCount(titleWords);
		question.wordCounts = count;
		question.titleWordCounts = titlWordCount;
		// console.log(question)
		// docStorage.create(question)
		questions.push(question);

	}
	lineCount++;
	// console.log(lineCount);
});
rl.on('close', function() {
	console.log(questions.length);
	console.log("updateQuestions start")
	//store tf idf
	// updateQuestions(questions)

	// storeQuestions(questions)

});



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