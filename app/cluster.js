var readData = require('./readData');
var clusterManager = require('../lib/knn');
var fs = require('fs');
var clusterInfo = require('../datas/academia/cluster');
readData.excute(updateQuestions);

function updateQuestions(questions) {
	clusterManager.kNN(questions).done(function(n) {
		console.log(n.tags)
		// writeToFile(n.neighbors, "cluster.js");
		// writeToFile(n.tags, "tags.js");

	});
}

// clusterManager.loadCluster(clusterInfo.data)
// goo();
// function goo() {
// 	question = {
// 		id: '2',
// 		body: 'Which online resources are available for job search at the Ph.D. level in the computational chemistry field ?',
// 		tags: ['phd', 'job-search', 'chemistry'],
// 	};
// 	clusterManager.classifier(question).done(function(q) {
// 		console.log("title!!!!")
// 		console.log(q);

// 	});
// }

function writeToFile(obj, fileNme) {
	// var obj = {
	// 	foo: "bar"
	// };
	var str = JSON.stringify(obj)
	str = "exports.data = " + str;
	fs.writeFile("../datas/academia/" + fileNme, str, function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("The file was saved!");
		}
	});
}