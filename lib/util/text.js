var _ = require('underscore');

exports.bagOfWords = bagOfWords;


function bagOfWords(text, distinct) {
	var outString = text.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
	var words = outString.split(' ');
	words = _.filter(words, function(word) {
		return word != '';
	});
	words = _.map(words, function(word) {
		return word.toLowerCase();
	})
	if (distinct) {
		return _.uniq(words);
	} else {
		return words;
	}
}
