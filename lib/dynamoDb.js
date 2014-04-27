var AWS = require('aws-sdk');
module.exports = function(config) {

	AWS.config.loadFromPath(config);
	var db = new AWS.DynamoDB();


}


function putItem() {

}