var _ = require('underscore');
var doc = "Do you mean in private industry or in an instructional capacity?  I suspect that these answers will vary wildly based on geographic region(s) your interested in, so it'd be nice to have that information.";
var doc2 = "I want to get the PhD, but the MSc is just the first step into the PhD.";
var doc3 = "@OldTroll: You're completely right. I didn't think of them, so thanks for catching that.";
var doc4 = "We could start writing down our salaries here... that would give some interesting comparison";

function extreactSentence(doc) {
	var sentences = doc.split(".")
	sentences = _.map(sentences, function(sentence) {
		return sentence.split("?");
	});
	sentences = _.flatten(sentences)
	sentences = _.without(sentences, "")
	console.log(sentences)
}

extreactSentence(doc4)