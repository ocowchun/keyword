var tagManager = require('../lib/redis_model/tag');
var tagWordManager = require('../lib/redis_model/tag_word');
var tagTitleManager = require('../lib/redis_model/tag_title');


var Q = require('Q');
var _ = require("underscore");

function getTags() {
	var deferred = Q.defer();
	tagManager.getAllTags().done(function(tags) {
		deferred.resolve(tags);
	});
	return deferred.promise;
}



getTags().done(function(tags) {
	//update!!
	// updateAllWordCount(tags);
});


function updateAllWordCount(tags, deferred) {
	deferred = deferred || Q.defer();
	if (tags.length > 0) {
		var tag = tags.pop();
		updateWordCount(tag).done(function() {
			updateAllWordCount(tags, deferred);
		});

	} else {
		deferred.resolve();

	}
	return deferred.promise;

}


function updateWordCount(tag) {
	var deferred = Q.defer();

	tagTitleManager.getTagWords(tag).done(function(words) {
		var count = sum(words);
		console.log(count);
		tagManager.setTagTitleWordCount(tag, count).done(function() {
			deferred.resolve();
		});

	})
	return deferred.promise;
}

//setTagWordCount
function sum(words) {
	return _.reduce(words, function(memo, str) {
		var num = str * 1;
		return memo + num;
	}, 0);

}