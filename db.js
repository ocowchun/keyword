var AWS = require('aws-sdk');
AWS.config.loadFromPath('./aws_config.json');
var db = new AWS.DynamoDB();

db.listTables(function(err, data) {
	console.log(data.TableNames);
});

var params = {
	Item: { // required
		"question_id": {
			"S": "4"
		},
		tags: {

			SS: ['php',
				'image-processing', 'file-upload', 'upload', 'mime-types'
			]
		},
		"check": {
			N: '1'
		},
		"uploaded": {
			N: '1'
		}

		// anotherKey: ...
	},
	TableName: 'questions' // required

};
// db.putItem(params, function(err, data) {
// 	if (err) console.log(err, err.stack); // an error occurred
// 	else console.log(data); // successful response
// });

var params = {
  RequestItems: { // required
    questions: {
      Keys: [ // required
        {
          question_id: {
         
            S: '4',
            
          },
          // anotherKey: ...
        },
        // ... more items ...
      ],
     
      ConsistentRead: true 
    },
    // anotherKey: ...
  }
};
db.batchGetItem(params, function(err, data) {
	if (err) console.log(err, err.stack); // an error occurred
	else {
console.log(data);
console.log(data.Responses.questions)

	} // successful response
});


