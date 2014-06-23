var docStorage = require('.././redis_model/doc');
var questionManager = require('.././redis_model/question');
var Q = require('Q');

exports.incrDoc = function(word) {
	return docStorage.incrDoc(word);
}

exports.incrDocs = function(words) {
	return docStorage.incrDocs(words);
}

exports.getDoc = function(word) {
	return docStorage.getDoc(word);
}

exports.getQuestionCluster = function(question_id) {
	return questionManager.getQuestionCluster(question_id)
}

exports.setQuestionCluster = function(question_id) {
	return questionManager.setQuestionCluster(question_id)
}

function incrDocs(words, deferred) {
	deferred = deferred || Q.defer();

	if (words.length > 0) {
		var word = words.pop();
		docStorage.incrDoc(word).done(
			function() {
				incrDocs(words, deferred);
			});
	} else {
		deferred.resolve();
	}
	return deferred.promise;
}


function idf(words) {
	var deferred = Q.defer();
	docStorage.getDocs(words).done(function(counts) {
		deferred.resolve(counts);
	});
	return deferred.promise;
}