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

// { id: '2',
//   body: 'I have a Google Nexus One with Android 2.2. I didn\'t like the default SMS-application so I installed Handcent-SMS. Now when I get an SMS, I get notified twice. How can I fix this?',
//   tags: [ '2.2-froyo', 'sms', 'notifications', 'handcent-sms' ],
//   title: 'I installed another SMS application, now I get notified twice',
//   wordCounts: 
//    { '22': 1,
//      i: 6,
//      have: 1,
//      a: 1,
//      google: 1,
//      nexus: 1,
//      one: 1,
//      with: 1,
//      android: 1,
//      didnt: 1,
//      like: 1,
//      the: 1,
//      default: 1,
//      smsapplication: 1,
//      so: 1,
//      installed: 1,
//      handcentsms: 1,
//      now: 1,
//      when: 1,
//      get: 2,
//      an: 1,
//      sms: 1,
//      notified: 1,
//      twice: 1,
//      how: 1,
//      can: 1,
//      fix: 1,
//      this: 1 },
//   titleWordCounts: 
//    { i: 2,
//      installed: 1,
//      another: 1,
//      sms: 1,
//      application: 1,
//      now: 1,
//      get: 1,
//      notified: 1,
//      twice: 1 } }