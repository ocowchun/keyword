var naiveBayes = require('../../lib/naiveBayer2');
var _ = require('underscore');
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var Q = require('Q');

var readData = require('../readData');
var clusterTag = require('../clusterTag');

var clusterManager = require('../../lib/knn');
var fs = require('fs');
var clusterInfo = require('../../datas/academia/cluster');

var csvFileName = "../../academia.stackexchange.com/Posts.xml";

clusterManager.loadCluster(clusterInfo.data)
readData.excute(updateQuestions, csvFileName);


function updateQuestions(questions) {
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

function exportWordToArray(wordCounts) {
	var words = [];
	for (var word in wordCounts) {
		words.push(word);
	}
	return words;
}


//train question 本身的tag加上所屬cluster的tag
function getExpectTags(question) {
	var deferred = Q.defer();
	var expectTags = question.tags;
	clusterManager.classifier(question).done(function(q) {

		var clusterId = q.cluster;
		var cluster = clusterTag.findCluster(clusterId)
		deferred.resolve(_.union(expectTags, cluster.tags));

	});
	return deferred.promise;
}
//undefined
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
	var deferred = Q.defer();
	var wordAry = exportWordToArray(question.wordCounts);
	// var expectTags = question.tags;

	getExpectTags(question).done(function(expectTags) {
		classifier(wordAry).done(function(classifierTags) {
			calculateScore(classifierTags, expectTags);
			deferred.resolve();
		});
	});

	return deferred.promise;
}

var totalScore = 0,
	totalQuestion = 0,
	goodQuestion = 0;
//計算前10明內的有幾個是對的,一個對的加一分 然後除預期tag數
function calculateScore(classifierTags, expectTags) {
	classifierScore = 0;
	if (expectTags.length > 0) {
		_.each(expectTags, function(tag) {
			var score = findIndex(classifierTags.slice(0, 10), tag) + 1;
			if (score != 11) {
				classifierScore += 1
			}
		});
		classifierScore = classifierScore / expectTags.length //normalizeScore(classifierScore, expectTags);
		if (classifierScore > 0) {
			goodQuestion++;
		}
	}
	console.log("final score");
	totalScore += classifierScore;
	totalQuestion++;
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

// var tags = [
// 		{
// 			tag: 'chemistry',
// 			probaility: -48.69373813581992
// 		}, {
// 			tag: 'new-zealand',
// 			probaility: -58.840464342326335
// 		}, {
// 			tag: 'break-of-study',
// 			probaility: -60.74517637259666
// 		}, {
// 			tag: 'recruiting',
// 			probaility: -61.11405868133195
// 		}, {
// 			tag: 'chinese-education',
// 			probaility: -61.53549039207497
// 		}, {
// 			tag: 'foo',
// 			probaility: -61.575977589210055
// 		}, {
// 			tag: 'job-search',
// 			probaility: -63.06843059917587
// 		}, {
// 			tag: 'abroad',
// 			probaility: -63.74033806408628
// 		}, {
// 			tag: 'scientometrics',
// 			probaility: -64.26492351651167
// 		}, {
// 			tag: 'introduction',
// 			probaility: -64.52020845118432
// 		}, {
// 			tag: 'publicity',
// 			probaility: -64.66298184384777
// 		}, {
// 			tag: 'pubmed',
// 			probaility: -64.72174483226988
// 		}, {
// 			tag: 'cv',
// 			probaility: -65.08315462646631
// 		}, {
// 			tag: 'metrics',
// 			probaility: -65.13497556377038
// 		}, {
// 			tag: 'proceedings',
// 			probaility: -65.50495470654192
// 		}, {
// 			tag: 'career-path',
// 			probaility: -65.65645207122353
// 		}, {
// 			tag: 'systematic',
// 			probaility: -66.001689837659
// 		}, {
// 			tag: 'meta',
// 			probaility: -66.001689837659
// 		}, {
// 			tag: 'research-group',
// 			probaility: -66.11517301946547
// 		}, {
// 			tag: 'fellowships',
// 			probaility: -66.36812430292778
// 		}, {
// 			tag: 'research',
// 			probaility: -66.38213765583434
// 		}, {
// 			tag: 'program-committee',
// 			probaility: -66.39152831360838
// 		}, {
// 			tag: 'immaterial-property',
// 			probaility: -66.57094571135745
// 		}, {
// 			tag: 'gradebook',
// 			probaility: -66.68432188390561
// 		}, {
// 			tag: 'part-time',
// 			probaility: -66.76506839221996
// 		}, {
// 			tag: 'dating',
// 			probaility: -66.8505305735766
// 		}, {
// 			tag: 'postdocs',
// 			probaility: -67.20820843770447
// 		}, {
// 			tag: 'job',
// 			probaility: -67.41281434720793
// 		}, {
// 			tag: 'privacy',
// 			probaility: -67.47480578361154
// 		}, {
// 			tag: 'transcript-of-records',
// 			probaility: -67.65664719723343
// 		}, {
// 			tag: 'distance-learning',
// 			probaility: -67.69934125886999
// 		}, {
// 			tag: 'united-states',
// 			probaility: -67.75217707595765
// 		}, {
// 			tag: 'university',
// 			probaility: -67.76784756128876
// 		}, {
// 			tag: 'survey',
// 			probaility: -67.87393429951015
// 		}, {
// 			tag: 'phd',
// 			probaility: -67.95871085265267
// 		}];



// var s = calculateScore(tags, ['phd', 'job-search', 'chemistry']);
// console.log(s)