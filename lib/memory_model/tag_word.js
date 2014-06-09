var academia_data = require('../../datas/academia/test2').data;
var _ = require("underscore");
var Q = require('Q');


function getTagKey(tagName) {
	return "tag_" + tagName;
}

function listAllTagWord(tagName) {
	var tagKey = getTagKey(tagName);
	var data = academia_data[tagKey];
	var words = [];
	for (var word in data) {
		words.push(word);
	}
	return words;
}

function findFromTagAndWord(tagName, words) {
	var tagKey = getTagKey(tagName);
	var wordCounts = [];
	_.each(words, function(word) {
		var wordCount = academia_data[tagKey][word];
		wordCounts.push(wordCount);
	});
	return wordCounts;
}


//回傳一共有幾個不同的word出現在指定tagName
exports.getCountFromTag = function(tagName) {
	var deferred = Q.defer();
	deferred.resolve(listAllTagWord(tagName));
	return deferred.promise;
}

exports.findFromTagAndWord = function(tagName, words) {
	var deferred = Q.defer();
	deferred.resolve(findFromTagAndWord(tagName, words));
	return deferred.promise;
}

// exports.getCountFromTag("metrics").done(function(result) {
// 	console.log(result)
// });

// for(var i=0,max=1000;i<max;i++){
// exports.findFromTagAndWord("metrics",["can","I","who"]).done(function(result){
// console.log(result)
// });
// }
// var g = academia_data["tag_metrics"]["I"]
// console.log(g)