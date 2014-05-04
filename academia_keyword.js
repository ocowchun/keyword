var _ = require('underscore');
var body = "&lt;p&gt;As from title. What kind of visa class do I have to apply for, in order to work as an academic in Japan ? &lt;/p&gt;&#xA;";
var tagManager = require('./lib/mysql_model/tag');
var tagWordManager = require('./lib/mysql_model/tag_word');
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

	return question;
}


function getId(row) {
	var idStart = row.indexOf('Id="') + 4;
	var idEnd = row.indexOf('"', idStart);
	var id = row.substring(idStart, idEnd);
	return id;

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

var csvFileName = "academia.stackexchange.com/Posts.xml";

var instream = fs.createReadStream(csvFileName);
var outstream = new stream;
var rl = readline.createInterface(instream, outstream);


var fileContent = "";
var lineCount = 0;
var questions = [];

rl.on('line', function(line) {

	if (lineCount > 2) {
		var question = parse(line);
		var words = bagOfWords(question.body);
		var count = wordCount(words);
		question.wordCounts = count;
		// questions.push(question);
		var start = 2,
			end = start + 100;
		if (lineCount==3) {
			questions.push(question);

		}
	}
	lineCount++;
	// console.log(lineCount);
});
rl.on('close', function() {
	console.log(questions.length);
	console.log("updateQuestions start")
	updateQuestions(questions);
});


function updateQuestions(questions) {
	if (questions.length > 0) {
		var question = questions.pop();
		console.log("update id:" + question.id);
		updateItem(question).then(
			function() {
				console.log("fuck");
				console.log(questions.length);
				updateQuestions(questions);
			});
	}
}

function updateItem(question) {
	console.log("updateItem start");
	var deferred = Q.defer();
	updateTags(question.tags).then(function() {
		console.log("updateAllTagWords start");
		updateAllTagWords(question.wordCounts, question.tags).then(function() {
			console.log("updateItem done");
			deferred.resolve();
		});
	})
	return deferred.promise;
}

function updateTags(tagStrs) {
	console.log("updateTags start");
	var deferred = Q.defer();
	var tags = [];
	_.each(tagStrs, function(tag) {
		tags.push({
			name: tag,
			count: 1
		});

	});

	if (tags.length > 0) {
		tagManager.update(tags).done(function() {
			console.log("updateTags done");
			deferred.resolve();
		});
	} else {
		console.log("updateTags done");
		deferred.resolve();
	}

	return deferred.promise;
}

function updateAllTagWords(wordCounts, tagNames, deferred) {
	deferred = deferred || Q.defer();
	if (tagNames.length > 0) {
		var tagName = tagNames.pop();
		updateOneTagWords(wordCounts, tagName).done(
			function() {
				updateAllTagWords(wordCounts, tagNames, deferred);
			});
	} else {
		console.log("updateAllTagWords done")
		deferred.resolve();
	}
	return deferred.promise;
}

function updateOneTagWords(wordCounts, tagName) {
	// var deferred = Q.defer();
	var tagWords = [];
	for (var word in wordCounts) {
		var count = wordCounts[word];
		var tagWord = {
			content: word,
			tag_name: tagName,
			count: count
		};
		tagWords.push(tagWord);
	}
	return tagWordManager.update(tagWords);

}

// var str1 = "&lt;p&gt;If your institution has a subscription to Journal Citation Reports (JCR), you can check it there. Try this URL:&lt;/p&gt;&#xA;&#xA;&lt;p&gt;&lt;a href=&quot;http://isiknowledge.com/jcr&quot;&gt;http://isiknowledge.com/jcr&lt;/a&gt;&lt;/p&gt;&#xA;";
// str1 = getTextFromHtml(str1);
// console.log(str1)

// var AWS = require('aws-sdk');
// AWS.config.loadFromPath('./aws_config.json');
// var db = new AWS.DynamoDB();

// function putItem(question) {

// 	var item = { // required
// 		"question_id": {
// 			"S": question.id
// 		}
// 	};

// 	if (question.tags.length > 0) {
// 		item["ke_tags"] = {
// 			SS: question.tags
// 		}
// 	}

// 	var wordCounts = question.wordCounts;

// 	for (var word in wordCounts) {
// 		var count = wordCounts[word];
// 		item[word] = {
// 			N: count.toString()
// 		}
// 	}

// 	var params = {
// 		Item: item,
// 		TableName: 'questions', // required

// 	};
// 	db.putItem(params, function(err, data) {
// 		if (err) {
// 			console.log(item);
// 			console.log(err, err.stack);
// 		} // an error occurred
// 		else console.log(data); // successful response
// 	});
// }