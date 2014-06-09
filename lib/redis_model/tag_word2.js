//class
var config = require('../../config/redis_config').config;
var redis = require('redis');
var _ = require("underscore");
var Q = require('Q');

function TagWordManager(name) {
	this.client = null;
	this.currentConnect = 0;
	this.name = name;

}

TagWordManager.prototype.getKey = function getKey(tagName, word) {
	return "tagword_" + tagName + "_" + word;
}

TagWordManager.prototype.getKeys = function getKeys(tagName, words) {
	var that = this;
	return _.map(words, function(word) {
		return that.getKey(tagName, word);
	});
}

TagWordManager.prototype._findFromTagAndWord = function _findFromTagAndWord(tagName, words) {
	var deferred = Q.defer();
	var keys = this.getKeys(tagName, words);
	this.client.mget(keys, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}


TagWordManager.prototype.update = function update(word) {
	var deferred = Q.defer();
	var content = word.content,
		tagName = word.tag_name,
		count = word.count;
	this.find_or_create(tagName, content).done(function(result) {
		if (result != null) {
			var newCount = result * 1 + count;
			this.updateByTagName(tagName, content, newCount).done(function(result) {
				deferred.resolve(result);
			});
		}
	});
	return deferred.promise;
}

TagWordManager.prototype.updateByTagName = function updateByTagName(tagName, word, count) {
	var deferred = Q.defer();
	var key = getKey(tagName, word);
	this.client.set(key, count, function(err, result) {
		deferred.resolve(result);
	});

	return deferred.promise;
}



TagWordManager.prototype.listAllTagWord = function listAllTagWord(tagName) {
	var deferred = Q.defer();
	var key = this.getKey(tagName, "*");
	this.client.keys(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

TagWordManager.prototype.find_or_create = function find_or_create(tagName, word) {
	var deferred = Q.defer();
	this.find(tagName, word).done(function(result) {
		if (result != null) {
			deferred.resolve(result);
		} else {
			this.create(tagName, word).done(
				function(result) {
					deferred.resolve(result);
				});
		}
	});
	return deferred.promise;
}



TagWordManager.prototype.create = function create(tagName, word) {
	var deferred = Q.defer();
	var key = this.getKey(tagName, word);
	this.client.set(key, 0, function(err, result) {
		deferred.resolve(0);
	});
	return deferred.promise;
}

TagWordManager.prototype.find = function find(tagName, word) {
	var deferred = Q.defer();
	var key = getKey(tagName, word);

	this.client.get(key, function(err, result) {
		deferred.resolve(result);
	});
	return deferred.promise;
}

TagWordManager.prototype.open = function() {
	if (this.currentConnect == 0) {
		this.client = redis.createClient(config.port, config.host);
		console.log("open:" + this.name);

	}
	this.currentConnect++;
}

TagWordManager.prototype.close = function close() {
	this.currentConnect--;
	if (this.currentConnect == 0) {
		this.client.quit();
		console.log("close:" + this.name + "  " + showCurrentTime());
	}
}

// exports.quit = function() {
// 	client.quit();
// }
TagWordManager.prototype.update = function(tag_words) {
	var deferred = Q.defer();
	this.open();
	var current = 0,
		max = tag_words.length;

	_.each(tag_words, function(word) {
		update(word).done(function() {
			current++;
			if (current == max) {
				close();
				deferred.resolve();
			}
		});
	});
	return deferred.promise;
}

// exports.update = function(tag_words) {
// 	var deferred = Q.defer();
// 	open();
// 	var current = 0,
// 		max = tag_words.length;

// 	_.each(tag_words, function(word) {
// 		update(word).done(function() {
// 			current++;
// 			if (current == max) {
// 				close();
// 				deferred.resolve();
// 			}
// 		});
// 	});
// 	return deferred.promise;
// }

TagWordManager.prototype.findFromTagAndWord = function(tagName, words) {
	var deferred = Q.defer();
	this.open();
	var that = this;
	this._findFromTagAndWord(tagName, words).done(function(result) {
		that.close();
		deferred.resolve(result);
	});
	return deferred.promise;
}


//回傳一共有幾個不同的word出現在指定tagName
TagWordManager.prototype.getCountFromTag = function(tagName) {
	var deferred = Q.defer();
	this.open();
	var that = this;
	console.log("start:" + tagName + " " + showCurrentTime())
	this.listAllTagWord(tagName).done(function(result) {
		that.close();
		deferred.resolve(result);
	});
	return deferred.promise;
}
var t1 = new TagWordManager("t1");
var t2 = new TagWordManager("t2");

function showCurrentTime() {
	var date = new Date()
	return date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() //toTimeString()
}

var fs = require('fs');
var tagManager = require('./tag');
//save tag data to tfile
// tagManager.getAll().done(function(result) {
// 	var tags = _.map(result, function(tag) {
// 		return tag.replace('tag_', '');
// 	});
// 	// console.log(words)
// 	// tags = tags.slice(0, 10);
// 	_.each(tags, function(tag) {
// 		// console.log(tag)
// 		find_word_count(tag);
// 	});

// })

var bigDic = {};
var currentDic = 0;

function addToBigDic(tagName, dic) {
	bigDic["tag_" + tagName] = dic;
	currentDic++;
	if (currentDic == 307) {
		// console.log(bigDic);
		// writeToFile(bigDic);
	}
}
// find_word_count("journals")
function find_word_count(tagName) {

	t1.getCountFromTag(tagName).done(function(result) {
		// console.log(result);
		var words = _.map(result, function(word) {
			return word.replace('tagword_' + tagName + '_', '');
		});

		t1.findFromTagAndWord(tagName, words).done(
			function(counts) {
				// console.log(counts);
				var dic = {};
				for (var i = 0, max = words.length; i < max; i++) {
					var count = counts[i];
					var word = words[i];
					dic[word] = count * 1;
				}
				addToBigDic(tagName, dic);
				// console.log(bigDic);
				// writeToFile(dic);
			});
	});
}


//read the save dic
// var academia_data = require('../../datas/academia/test').data;
//  console.log(academia_data.tag_visiting.ineffectualWhat);
// console.log(academia_data.tag_visiting.ineffectualWhat);
//  console.log(academia_data.tag_visiting.ineffectualWhat);


// writeToFile();
function writeToFile(obj) {
	// var obj = {
	// 	foo: "bar"
	// };
	var str = JSON.stringify(obj)
	str = "exports.data = " + str;
	fs.writeFile("../../datas/academia/test.js", str, function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("The file was saved!");
		}
	});

}