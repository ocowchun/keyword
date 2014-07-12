var tagManager = require('../lib/redis_model/tag');
var tagWordManager = require('../lib/redis_model/tag_word');
var _ = require('underscore');
var fs = require('fs');


tagManager.getAll().done(function(result) {
	var tags = _.map(result, function(tag) {
		return tag.replace("tagu_", "");
	});
	_.each(tags, function(tag) {
		addTagInfoToBigDic(tag);
	})
})


function addTagInfoToBigDic(tagName) {
	tagWordManager.getCountFromTag(tagName).done(function(words) {
		words = _.map(words, function(word) {
			var prefix = "tagwordu_" + tagName + "_";
			return word.replace(prefix, "");
		});
		findFromTagAndWord(tagName, words)
	})
}

var bigDic = {};
var currentDic = 0;

function addToBigDic(tagName, dic) {
	bigDic["tag_" + tagName] = dic;
	currentDic++;
	console.log("add tag:" + tagName);
	if (currentDic == 306) {
		console.log(bigDic);
		writeToFile(bigDic);
	}
}


//由tag與word找到對應的wordcount,加到dic 丟到 bigdic
function findFromTagAndWord(tagName, words) {
	tagWordManager.findFromTagAndWord(tagName, words).done(function(counts) {
		// console.log(result);
		var dic = addWordToTag(tagName, words, counts);
		addToBigDic(tagName, dic);
	})
}


function addWordToTag(tagName, words, counts) {

	var dic = {};
	for (var i = 0, max = words.length; i < max; i++) {
		var count = counts[i];
		var word = words[i];
		dic[word] = count * 1;
	}
	return dic;
}

function writeToFile(obj) {
	// var obj = {
	// 	foo: "bar"
	// };
	var str = JSON.stringify(obj)
	str = "exports.data = " + str;
	fs.writeFile("../datas/academia/test2.js", str, function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("The file was saved!");
		}
	});

}

//exports.data = {"tag_visiting":{"1":1,"2":1,
//