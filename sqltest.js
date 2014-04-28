// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database('db/dev.sqlite3');

// db.serialize(function() {
//   // db.run("CREATE TABLE lorem (info TEXT)");

//   var stmt = db.prepare('INSERT INTO tags(name,count) VALUES (?,?)');
//   for (var i = 0; i < 2; i++) {
//       stmt.run('Ipsum',i);
//   }
//   stmt.finalize();

//   // db.each("SELECT rowid AS id, info FROM tags", function(err, row) {
//   //     console.log(row.id + ": " + row.info);
//   // });
// });

// db.close();

var tag = require('./lib/model/tag');
var tag_word = require('./lib/model/tag_word');
var Q = require('Q');
// console.log(tag)

var word1 = {
	content: 'fuck',
	tag_name: 'Ipsum8',
	count: 3
}, word2 = {
		content: 'fuck',
		tag_name: 'Ipsum2',
		count: 2
	},
	words = [word1, word2];

// tag_word.update(words);


function find(tag_name) {
	var deferred = Q.defer();
	tag.find_or_create(tag_name, function(err, result) {
		if (err) {
			deferred.reject(new Error("Status code was " + request.status));
		} else {
			deferred.resolve(result)
			// console.log(123)
			// console.log(result);
		}
	});
	return deferred.promise;
}

var find2 = function(result) {
	log(result);
	return find('Ipsum2');
}
var log = function(result) {
	console.log(result)
}

var c = ['123', '456'];
c.pop();
c.pop();
c.pop();

console.log(c);

// find('Ipsum7').then(find2).done(log);
// Q.all([find('Ipsum7'),find('Ipsum2'),find('Ipsum3')]).done(function(){
// 	console.log(arguments[0]);
// });
//research promise.js

// var tag1 = {
// 	name: 'Ipsum8',
// 	count: 3
// }, tag2 = {
// 		name: 'Ipsum2',
// 		count: 2
// 	},
// 	tags = [tag1, tag2];
// tag.update(tags);