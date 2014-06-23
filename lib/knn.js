'use strict';
var _ = require('underscore');
var questionManager = require('./models/doc');
var textUtil = require('./util/text');
var Q = require('Q');
var maxCluster = 0;

var neighbors = [];

function kNN(questions) {


}

function dokNN(questions, deferred) {
	deferred = deferred || Q.defer();
	if (questions.length > 0) {
		var question = questions.pop();
		classifier(question).done(
			function() {
				dokNN(words, deferred);
			});
	} else {
		deferred.resolve();
	}
	return deferred.promise;

}

// 透過分類器由最接近的k個neighbor,找到question所屬群集
function classifier(question) {
	var deferred = Q.defer();
	var k = 5;
	getNearestNeighbors(question, k).done(function(nns) {

	});
	return deferred.promise;
}

// 由NearestNeighbors決定分類
function get_cluster(nns) {
	// body...
	if (nns.length > 0) {
		return nns[0].cluster;
	} else {
		return maxCluster++;
	}
}

//取得最接近的k個neighbor
function getNearestNeighbors(question, k) {
	var deferred = Q.defer();
	var neighbors = getNeighbors();

	calculatesDistances(question, neighbors).done(function(ns) {
		var sortNs = _.sortBy(ns, function(n) {
			return 1 - n.dist;
		});
		deferred.resolve(sortNs);
	});
	sortNs = sortNs.slice(0, k);
	return deferred.promise;
}

//取得全部的neighbors
function getNeighbors() {
	// body...
	return neighbors;
}

//計算問題與鄰居的距離
function calculatesDistances(question, neighbors, dists, deferred) {
	deferred = deferred || Q.defer();
	dists = dists || [];
	if (neighbors.length > 0) {
		var neighbor = neighbors.pop();
		getDistance(question, neighbor).done(
			function(dist) {
				dists.push(dist);
				calculatesDistances(question, neighbors, dists, deferred);
			});
	} else {
		deferred.resolve(dists);
	}
	return deferred.promise;
}

// function generateDocDist(){}


//取得兩個question的距離
function getDistance(question1, question2) {
	var deferred = Q.defer();
	var words1 = getBagOfWords(question1.body);
	var words2 = getBagOfWords(question2.body);
	var coWords = _.intersection(words1, words2);

	Q.all([getIDF(words1), getIDF(words2), getIDF(coWords)]).done(function(result) {
		var idf1 = result[0],
			idf2 = result[1],
			coIdf = result[2];
		var dist = product(coIdf) / (productSquare(idf1) * productSquare(idf2));
		var obj = {
			dist: dist - Math.random(),
			question_id: question2.id,
			cluster: question2.cluster
		};
		deferred.resolve(obj);

	});
	return deferred.promise;
}

function getIDF(words) {
	return questionManager.idf(words);
}

function getBagOfWords(text) {
	return textUtil.bagOfWords(text, true);
}

function product(nums) {
	return _.reduce(nums, function(memo, num) {
		return memo + Math.pow(num, 2);
	}, 0);
}

function productSquare(nums) {
	var productSum = product(nums);
	return Math.sqrt(productSum);
}



var body = "&lt;p&gt;As from title. What kind of visa class do I have to apply for, in order to work as an academic in Japan ? &lt;/p&gt;&#xA;";
var q = {
	id: 1,
	body: body,
	cluster: 1
};
// getDistance(q, q).done(function(result) {
// 	console.log(result);
// })

// calculatesDistances(q, [q, q, q, q, q, q, q, q]).done(console.log);

calculatesDistances(q, [q, q, q, q, q, q, q, q]).done(function(ns) {
	var sortNs = _.sortBy(ns, function(n) {
		return 1 - n.dist;
	});
	sortNs = sortNs.slice(0, 100)
	console.log(sortNs)
});


// var w = getBagOfWords(body);
// console.log(w);

// getIDF(w).done(function(result) {
// 	console.log(result);
// })