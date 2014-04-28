var sqlite3 = require('sqlite3').verbose();
var _ = require("underscore");
var Q = require('Q');

var db;

function open() {
	db = new sqlite3.Database('db/dev.sqlite3');
};

function close() {
	db.close();

};

exports.update = function(tag_words) {
	var deferred = Q.defer();
	open();
	var current = 0,
		max = tag_words.length;

	db.serialize(function() {
		_.each(tag_words, function(word) {
			update(db, word).done(function() {
				current++;
				if (current == max) {
					close();
					deferred.resolve();
				}
			});
		});
	});
	return deferred.promise;
}


function update(db, word) {
	var deferred = Q.defer();

	var content = word.content,
		tag_name = word.tag_name,
		count = word.count;
	find_or_create(db, content, tag_name, function(err, result) {
		if (result != undefined) {
			update_by_id(db, result.id, count).done(deferred.resolve());
		}

	});
	return deferred.promise;
}

function update_by_id(db, id, count) {
	var deferred = Q.defer();

	db.serialize(function() {
		var stmt = db.prepare('update tag_words set count=count+? where id=?');
		stmt.run(count, id);
		stmt.finalize();
		deferred.resolve()
	});
	return deferred.promise;
}

function find_or_create(db, word, tag_name, cb) {

	find(db, word, tag_name, function(err, result) {
		if (result == undefined) {
			create(db, word, tag_name, cb);
		} else {

			cb(err, result);
		}
	});
}

// open();
// var db2 = new sqlite3.Database('../../db/dev.sqlite3');
// update_by_id(db2, 3, 2).done(function(){db2.close()});
// find_or_create(db2, "hello", "123", function() {
// 	console.log(arguments);
// 	db2.close();
// });

function create(db, word, tag_name, cb) {
	db.serialize(function() {
		var stmt = db.prepare('INSERT INTO tag_words(content,tag_name,count) VALUES (?,?,?)');
		stmt.run(word, tag_name, 0);
		stmt.finalize();
		find(db, word, tag_name, cb);
	});
}

function find(db, word, tag_name, cb) {
	db.get("select id from tag_words where tag_name = ? and content= ?", [tag_name, word],
		function(err, result) {
			cb(err, result);
		});
}