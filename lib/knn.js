'use strict';
var _ = require('underscore');
var questionManager = require('./models/doc');
var textUtil = require('./util/text');
var Q = require('q');
var maxCluster = 0;

var neighbors = [];
var k = 5;
var clusterInfo = [];
exports.kNN = function kNN(questions) {

	return dokNN(questions);
}

exports.classifier = function(question) {

	return classifier(question);
}

exports.loadCluster = function loadCluster(data) {
	neighbors = data;
};

exports.meanOfIntraCluster = function meanOfIntraCluster(data) {
	meanOfIntraCluster();
};


function dokNN(questions, deferred) {
	deferred = deferred || Q.defer();
	if (questions.length > 0) {
		var question = questions.pop();
		classifier(question).done(
			function(neighbor) {
				addToNeighbors(neighbor);

				dokNN(questions, deferred);
			});
	} else {
		var result = generateResult();
		deferred.resolve(result);
	}
	return deferred.promise;

}

function generateResult() {
	var obj = {
		neighbors: neighbors
	};
	obj.tags = getClusterTagsInfo(neighbors);
	obj.count = _.countBy(neighbors, function(neighbor) {
		return "cluster" + neighbor.cluster;
	});

	console.log("question Size:" + neighbors.length)
	var mi = meanOfIntraCluster();
	var me = meanOfExternalCluster();
	console.log("cluster score: " + mi / me);
	return obj;
}

// 透過分類器由最接近的k個neighbor,找到question所屬群集，並加入群集
function classifier(question) {
	console.log("classifier" + neighbors.length)
	var deferred = Q.defer();

	getNearestNeighborsPar(question, k).done(function(nns) {

		var cluster = get_cluster(nns);
		var obj = {
				id: question.id,
				body: question.body,
				tags: question.tags,
				cluster: cluster
			}
			// console.log(obj)

		deferred.resolve(obj);

	});
	return deferred.promise;
}


function addToNeighbors(neighbor) {
	neighbors.push(neighbor);
}

// 由NearestNeighbors決定分類
function get_cluster(nns) {
	// body...
	if (maxCluster < 5) {
		if (nns.length > 0 && nns[0].dist > 0.82) {
			return nns[0].cluster;
		}
	} else {
		if (nns.length > 0) {
			if (nns[0].dist > 0.8) {
				return nns[0].cluster;
			} else {
				nns = _.filter(nns, function(neighbor) {
					return neighbor.dist > 0.72;
				});
				if (nns.length > 0) {

				}

			}
		}
	}
	return maxCluster++;
}

//nns>1時,決定cluster
function keFilter(nns) {
	var r = _.countBy(nns, function(neighbor) {
		return neighbor.cluster;
	});

	var x = function(r) {
		var max = 0,
			cluster;
		for (var neighbor in r) {
			if (r[neighbor] > max) {
				max = r[neighbor];
				cluster = neighbor;
			}
		}
		return cluster * 1;

	}(r);
}

//整理cluster的tag
function getClusterTagsInfo(neighbors) {
	var cm = clusterManager();
	_.each(neighbors, function(neighbor) {
		cm.addQuestion(neighbor);
	})
	return cm.clusters;
}
//美個cluster會包含所屬question_id,tags
function clusterManager() {
	var manager = {};
	manager.clusters = [];
	manager.findCluster = findCluster;

	function findCluster(id) {
		var c = _.find(manager.clusters, function(cluster) {
			return cluster.id == id;
		});
		if (c == null) {
			c = generateNewCluster(id)
			manager.clusters.push(c);
		}
		return c;
	}

	manager.addQuestion = function(question) {
		var clusterId = question.cluster;
		var tags = question.tags;
		var cluster = findCluster(clusterId);
		cluster.tags = _.union(cluster.tags, tags);
	}

	function generateNewCluster(id) {
		return {
			id: id,
			tags: []
		};
	}
	return manager;
}

function partition(ary, num) {
	var partSize = Math.floor(ary.length / num);
	var result = [];

	for (var i = 0, max = num; i < max; i++) {
		var from = i * partSize;
		var to = from + partSize;
		if (i == max - 1) {
			to += ary.length - (partSize * num);
		}
		result.push(ary.slice(from, to));
	}
	return result;
}
// var n = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12];

// var c = partition(n, 3);
// console.log(c)

//parallel 取得最接近的k個neighbor
function getNearestNeighborsPar(question, k) {
	var deferred = Q.defer();
	var neighbors = getNeighbors();
	var collection = partition(neighbors, 5);

	Q.all([
		getNearestNeighbors(question, k, collection[0]),
		getNearestNeighbors(question, k, collection[1]),
		getNearestNeighbors(question, k, collection[2]),
		getNearestNeighbors(question, k, collection[3]),
		getNearestNeighbors(question, k, collection[4])
	]).done(function(result) {
		var ns = [];
		_.each(result, function(n) {
			ns = ns.concat(n);

		});
		var sortNs = _.sortBy(ns, function(n) {
			return 1 - n.dist;
		});
		sortNs = sortNs.slice(0, k);
		deferred.resolve(sortNs);
	});


	return deferred.promise;
}

//取得最接近的k個neighbor
function getNearestNeighbors(question, k, neighbors) {
	var deferred = Q.defer();
	var neighbors = neighbors || getNeighbors();
	var t1 = Date.now();

	calculatesDistances(question, neighbors).done(function(ns) {
		var sortNs = _.sortBy(ns, function(n) {
			return 1 - n.dist;
		});
		sortNs = sortNs.slice(0, k);
		var t2 = Date.now();
		var diff = ((t2 - t1) / (1000))
		console.log(diff);
		deferred.resolve(sortNs);
	});

	return deferred.promise;
}

//取得全部的neighbors
function getNeighbors() {
	// body...
	return neighbors.slice(0, neighbors.length);
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
			dist: dist,
			question_id: question2.id,
			cluster: question2.cluster
		};
		similarityManager.addSimilarity(question1.id, question2.id, dist);

		deferred.resolve(obj);

	});
	return deferred.promise;
}

function getIDF(words) {
	//先全部的權重都設為一 來減少io QQ
	return questionManager.idf(words);

	// var result = _.map(words, function() {
	// 	return 1
	// });
	// return result;
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

//Mean of Intra-cluster Similarity
function meanOfIntraCluster() {
	var sim = 0;
	var neighborSize = neighbors.length;
	var groups = _.groupBy(neighbors, function(neighbor) {
		return neighbor.cluster;
	});
	for (var group_name in groups) {
		// console.log(group.length);
		var group = groups[group_name];
		// console.log(group)
		sim += (IntraClusterSimilarity(group) * group.length / neighborSize);
	}
	// console.log(groups["1"])
	console.log("meanOfIntraCluster: " + sim);
	return sim;
}

function IntraClusterSimilarity(group) {
	var sim = 0;
	var size = group.length;
	_.each(group, function(mem1) {
		_.each(group, function(mem2) {
			if (mem1.id != mem2.id) {
				sim += similarityManager.getSimilarity(mem1.id, mem2.id);

			}
		});
	});
	if (size > 1) {
		sim = sim / (size * (size - 1))

	} else {
		sim = 1;
	}
	// console.log("IntraClusterSimilarity: " + sim);
	return sim;
}


//Mean of Intra-cluster Similarity
function meanOfExternalCluster() {
	var sim = 0;
	var neighborSize = neighbors.length;
	var groupSize = 0;
	var groups = _.groupBy(neighbors, function(neighbor) {
		return neighbor.cluster;
	});

	for (var group_name in groups) {
		sim += externalClusterSimilarity(group_name, groups);
		groupSize++;
	}

	console.log("groupSize: " + groupSize);
	sim = sim / groupSize;
	console.log("meanOfExternalCluster: " + sim);
	return sim;
}

//平均群間相似度
function externalClusterSimilarity(groupName, groups) {
	var group1 = groups[groupName];
	var groupSize = 0;
	var sim = 0;
	for (var group_name in groups) {
		if (group_name != groupName) {
			var group2 = groups[group_name];
			sim += twoClusterSimilarity(group1, group2)
			groupSize++;
		}
	}
	sim = sim / groupSize;
	return sim;
}

//兩群的相似度,兩群間各取一個點的相似度去比較
function twoClusterSimilarity(group1, group2) {
	var sim = 0;
	var size = group1.length * group2.length;
	_.each(group1, function(member1) {
		_.each(group2, function(member2) {
			sim += similarityManager.getSimilarity(member1.id, member2.id);
		});
	});
	sim = sim / size;
	return sim;
}


var similarityManager = function() {
	var manager = {};
	var questionSimilaritys = [];

	manager.addSimilarity = function(q1, q2, similarity) {
		if (!questionSimilaritys[q1]) {
			questionSimilaritys[q1] = [];
		}
		if (!questionSimilaritys[q2]) {
			questionSimilaritys[q2] = [];
		}
		questionSimilaritys[q1][q2] = similarity;
		questionSimilaritys[q2][q1] = similarity;

	}

	manager.getSimilarity = function(q1, q2) {
		if (!questionSimilaritys[q1]) {
			return 0;
		}
		return questionSimilaritys[q1][q2] || null;
	}



	return manager;
}();


// twoClusterSimilarity(g1, g2);
// meanOfExternalCluster()

// IntraClusterSimilarity([{
// 	dist: 0.5206170800288081,
// 	question_id: '32',
// 	cluster: 33
// }, {
// 	dist: 0.5079806017505692,
// 	question_id: '21',
// 	cluster: 40
// }, {
// 	dist: 0.4991578411763876,
// 	question_id: '7',
// 	cluster: 48
// }, {
// 	dist: 0.48038758430332756,
// 	question_id: '107',
// 	cluster: 4
// }, {
// 	dist: 0.4789676615812818,
// 	question_id: '53',
// 	cluster: 4
// }])

// similarityManager.addSimilarity(1, 2,0.8);
// similarityManager.addSimilarity(7, 4,0.8);

// var s=similarityManager.getSimilarity(2, 2);


// var body = "&lt;p&gt;As from title. What kind of visa class do I have to apply for, in order to work as an academic in Japan ? &lt;/p&gt;&#xA;";
// var q = {
// 	id: 1,
// 	body: body,
// 	cluster: 1
// };
// getDistance(q, q).done(function(result) {
// 	console.log(result);
// })

// // calculatesDistances(q, [q, q, q, q, q, q, q, q]).done(console.log);

// calculatesDistances(q, [q, q, q, q, q, q, q, q]).done(function(ns) {
// 	var sortNs = _.sortBy(ns, function(n) {
// 		return 1 - n.dist;
// 	});
// 	sortNs = sortNs.slice(0, 100)
// 	console.log(sortNs)
// });


// var w = getBagOfWords(body);
// console.log(w);

// getIDF(w).done(function(result) {
// 	console.log(result);
// })