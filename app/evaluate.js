var readData = require('./readData');
var naiveBayes = require('.././lib/naiveBayer2');
var Q = require('q');
var _ = require('underscore');


var totalScore = 0,
	totalQuestion = 0,
	goodQuestion = 0;

readData.excute(updateQuestions);

function updateQuestions(questions) {
	var tagQuestion = 0;
	// _.each(questions, function(question) {
	// 	classifier(question);
	// });
	// console.log(tagQuestion);
	evaluateQuestions(questions)
}

function evaluateQuestions(questions) {
	if (questions.length > 0) {
		var question = questions.pop();
		console.log("update id:" + question.id);
		evaluate(question).then(
			function() {
				// console.log("fuck");
				// console.log(questions.length);
				evaluateQuestions(questions);
			});
	} else {
		// console.log(classifierScore);
		// total_score += classifierScore;
		console.log("goodQuestion")
		console.log(goodQuestion);
		console.log("total_score")
		console.log(totalScore);
		console.log("totalQuestion")
		console.log(totalQuestion);
		console.log("avg score");
		console.log(totalScore / totalQuestion);
	}

}

// tags: ['journals', 'bibliometrics', 'metrics'],
function evaluate(question) {
	var deferred = Q.defer();
	var expectTags = question.tags;
	classifier(question).done(function(classifierTags) {
		classifierTags = _.last(classifierTags, 3);
		calculateScore(classifierTags, expectTags);
		deferred.resolve();
	});
	return deferred.promise;
}

//計算前10明內的有幾個是對的,一個對的加一分 然後除預期tag數
function calculateScore(classifierTags, expectTags) {
	classifierScore = 0;

	console.log(expectTags);
	console.log(classifierTags)
	if (expectTags.length > 0) {
		_.each(expectTags, function(tag) {
			var score = findIndex(classifierTags, tag);
			if (score != -1) {
				classifierScore += 1
			}
		});
		if (classifierScore > 0) {
			goodQuestion++;
		}
	}
	// console.log("final score");
	totalScore += classifierScore;
	totalQuestion++;
	console.log("goodQuestion:" + goodQuestion + "  totalQuestion: " + totalQuestion)

	return classifierScore;
}

function exportWordToArray(wordCounts) {
	var words = [];
	for (var word in wordCounts) {
		words.push(word);
	}
	return words;
}


function findIndex(tags, targetTag) {
	for (var i = 0, max = tags.length; i < max; i++) {
		var tag = tags[i];
		if (tag.tag == targetTag) {
			return i;
		}
	}
	return -1;
}

function classifier(question) {
	var ws = exportWordToArray(question.wordCounts);
	var ts = exportWordToArray(question.titleWordCounts);

	return naiveBayes.classifier(ws, ts);

	// console.log(_.last([1,2,3,4,5],3))

}