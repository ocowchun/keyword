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

exports.update = function(tags) {
	var deferred = Q.defer();
	open();
	var current = 0,
		max = tags.length;

	db.serialize(function() {
		_.each(tags, function(tag) {
			update(db, tag.name, tag.count).done(function() {
				current++;
				if (current == max) {
					deferred.resolve()
					close();
				}
			});
		});
	});
	return deferred.promise;
}

exports.save = function() {
	var db = new sqlite3.Database('db/dev.sqlite3');

	db.serialize(function() {
		// db.run("CREATE TABLE lorem (info TEXT)");

		var stmt = db.prepare('INSERT INTO tags(name,count) VALUES (?,?)');
		for (var i = 0; i < 1; i++) {
			stmt.run('Ipsum', i);
		}
		stmt.finalize();

		// db.each("SELECT rowid AS id, info FROM tags", function(err, row) {
		//     console.log(row.id + ": " + row.info);
		// });
	});

	db.close();

}

function create(db, tag_name, cb) {
	db.serialize(function() {
		var stmt = db.prepare('INSERT INTO tags(name,count) VALUES (?,?)');
		stmt.run(tag_name, 0);
		stmt.finalize();
		find(db, tag_name, cb);
	});
}

function find(db, tag_name, cb) {
	db.get("select id from tags where name = ?", tag_name, function(err, result) {
		cb(err, result);
	});
}

function update(db, tag_name, count) {
	var deferred = Q.defer();

	find_or_create(db, tag_name, function(err, result) {
		if (result != undefined) {
			update_by_id(db, result.id, count).done(deferred.resolve());
		}

	});
	return deferred.promise;
}

function update_by_id(db, id, count) {
	var deferred = Q.defer();

	db.serialize(function() {
		var stmt = db.prepare('update tags set count=count+? where id=?');
		stmt.run(count, id);
		stmt.finalize();
		deferred.resolve()
	});
	return deferred.promise;
}

exports.find_or_create = function(tag_name, cb) {
	var db = new sqlite3.Database('db/dev.sqlite3');

	find_or_create(db, tag_name, function(err, result) {
		cb(err, result);
		db.close();
	});
}

function find_or_create(db, tag_name, cb) {
	find(db, tag_name, function(err, result) {
		if (result == undefined) {
			create(db, tag_name, cb);
		} else {
			cb(err, result);
		}
	});
}