var readData = require('./readData');
var _ = require('underscore');

readData.excute(updateQuestions);

function updateQuestions(questions) {
	var tagQuestion = 0;
	_.each(questions, function(question) {

		if (question.tags.length > 0) {
			tagQuestion++;
		}
	});
	console.log(tagQuestion);
}