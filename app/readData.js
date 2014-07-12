var _ = require('underscore');
// var tagManager = require('../lib/redis_model/tag');
// var tagWordManager = require('../lib/redis_model/tag_word');
// var tagTitleManager = require('../lib/redis_model/tag_title');
var docManager = require('../lib/models/doc');
var textUtil = require('../lib/util/text');


var _ = require('underscore')
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

// var csvFileName = "../academia.stackexchange.com/Posts.xml";
var csvFileName = "../datas/stackexchange/android.stackexchange/Posts.xml";



var fileContent = "";
var lineCount = 0;
var questions = [];

exports.excute = function(updateQuestions, fileName) {
	fileName = fileName || csvFileName;
	var instream = fs.createReadStream(fileName);

	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);

	rl.on('line', function(line) {

		if (lineCount >= 3 && lineCount<1000) {
			var question = textUtil.parse(line);
			var words = textUtil.bagOfWords(question.body);
			var titleWords = textUtil.bagOfWords(question.title);
			var count = textUtil.wordCount(words);
			var titlWordCount = textUtil.wordCount(titleWords);
			question.wordCounts = count;
			question.titleWordCounts = titlWordCount;
			questions.push(question);

		}
		lineCount++;
		// console.log(lineCount);
	});
	rl.on('close', function() {
		console.log("questions length: " + questions.length);
		console.log("updateQuestions start")
		updateQuestions(questions);

	});
};