var naiveBayes = require('../../lib/naiveBayes');
var _ = require('underscore');
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

// calculate three tag's probability
// naiveBayes.classifier(words).done(function(result) {
// 	var sg = _.sortBy(result, function(tag) {
// 		return tag.probaility;
// 	});
// 	console.log(sg);
// });


// var body = "&lt;p&gt;As from title. What kind of visa class do I have to apply for, in order to work as an academic in Japan ? &lt;/p&gt;&#xA;";
// var tagManager = require('./lib/redis_model/tag');
// var tagWordManager = require('./lib/redis_model/tag_word');
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



var csvFileName = "../../academia.stackexchange.com/Posts.xml";

var instream = fs.createReadStream(csvFileName);
var outstream = new stream;


var fileContent = "";
var lineCount = 0;
var questions = [];
readFile();

function readFile() {


	var rl = readline.createInterface(instream, outstream);

	rl.on('line', function(line) {

		if (lineCount >= 3&&lineCount<=500) {
			var question = parse(line);
			var words = bagOfWords(question.body);
			var count = wordCount(words);
			question.wordCounts = count;

			var wordAry = exportWordToArray(count);
			evaluate(question)
			// console.log(question)

			// questions.push(question);

		}
		lineCount++;
	});

	rl.on('close', function() {

		console.log(questions.length);
		console.log("updateQuestions start")
	});
}

function exportWordToArray(wordCounts) {
	var words = [];
	for (var word in wordCounts) {
		words.push(word);
	}
	return words;
}


//[ { tag: 'online-publication', probaility: -82.69919503775634 },
// { tag: 'foo', probaility: -81.03507907976321 },
// { tag: 'research-group', probaility: -80.80715818675877 },
// { tag: 'metrics', probaility: -41.62006181280034 } ]
function classifier(words) {
	var deferred = Q.defer();
	naiveBayes.classifier(words).done(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

// tags: ['journals', 'bibliometrics', 'metrics'],
function evaluate(question) {
	var wordAry = exportWordToArray(question.wordCounts);
	// console.log(wordAry)
	var expectTags = question.tags;
	classifier(wordAry).done(function(classifierTags) {
		calculateScore(classifierTags, expectTags);
	});

}

// 總分
var total_score = 0,
	totalQuestion = 0,
	goodQuestion = 0;

//計算前10明內的有幾個是對的,一個對的加一分 然後除預期tag數
function calculateScore(classifierTags, expectTags) {
	totalQuestion++;
	classifierScore = 0;
	if (expectTags.length > 0) {
		_.each(expectTags, function(tag) {
			var score = findIndex(classifierTags.slice(0, 10), tag) + 1;
			if (score != 11) {
				classifierScore += 1
			}
		});
		classifierScore = classifierScore / expectTags.length //normalizeScore(classifierScore, expectTags);

	}
	if (classifierScore > 0) {
		goodQuestion++;
	}

	console.log("final score");

	// console.log(classifierTags);
	console.log(classifierScore);
	total_score += classifierScore;
	console.log("goodQuestion")
	console.log(goodQuestion);
	console.log("total_score")
	console.log(total_score);
	console.log("totalQuestion")
	console.log(totalQuestion);
	console.log("avg score");
	console.log(total_score / totalQuestion);
	return classifierScore;
}

function calculateScore2(classifierTags, expectTags) {
	classifierScore = 0;
	_.each(expectTags, function(tag) {
		var score = findIndex(classifierTags, tag) + 1;

		console.log(score);
		classifierScore += score;
	});
	classifierScore = normalizeScore(classifierScore, expectTags);
	console.log("final score");

	console.log(classifierTags);
	console.log(classifierScore);
	return classifierScore;
}

function findIndex(tags, targetTag) {
	for (var i = 0, max = tags.length; i < max; i++) {
		var tag = tags[i];
		if (tag.tag == targetTag) {
			return i;
		}
	}
	return tags.length;
}
// 'phd', 'job-search', 'chemistry' 

function normalizeScore(score, tags) {
	var base = 0;
	if (tags.length > 0) {
		_(tags.length).times(function(n) {
			base += (n + 1);
		});
		console.log("base")
		console.log(base)
		return score / base;
	} else {

		return 11;
	}

}