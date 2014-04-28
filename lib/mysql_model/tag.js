var config = require('../../config/mysql_config').config;
// var sqlite3 = require('sqlite3').verbose();
var mysql = require('mysql');
var _ = require("underscore");
var Q = require('Q');

var pool;

function open() {
	pool = mysql.createPool(config);
};

function close() {
	pool.end();
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
					close();
					deferred.resolve();
				}
			});
		});
	});
	return deferred.promise;
}

// exports.save = function() {
// 	var db = new sqlite3.Database('db/dev.sqlite3');

// 	db.serialize(function() {
// 		// db.run("CREATE TABLE lorem (info TEXT)");

// 		var stmt = db.prepare('INSERT INTO tags(name,count) VALUES (?,?)');
// 		for (var i = 0; i < 1; i++) {
// 			stmt.run('Ipsum', i);
// 		}
// 		stmt.finalize();

// 		// db.each("SELECT rowid AS id, info FROM tags", function(err, row) {
// 		//     console.log(row.id + ": " + row.info);
// 		// });
// 	});

// 	db.close();

// }

// open();
// update("hello", 2).done(function(results) {
// 	if (results.length > 0) {
// 		// console.log(results[0].id);
// 		console.log(results);
// 	}
// 	close();
// });

function create(tag_name) {
	var deferred = Q.defer();
	pool.getConnection(function(err, connection) {
		// Use the connection
		var sql = 'INSERT INTO tags(name,count) VALUES ("' + tag_name + '",0)';
		console.log(sql);
		connection.query(sql, function(err, result) {
			if (err) throw err;
			connection.release();
			deferred.resolve(result.insertId);
		});
	});
	return deferred.promise;
}

function find(tag_name) {
	var deferred = Q.defer();
	pool.getConnection(function(err, connection) {
		// Use the connection
		var sql = 'select id from tags where name ="' + tag_name + '"';
		console.log(sql);
		connection.query(sql, function(err, result) {
			if (err) throw err;
			connection.release();
			deferred.resolve(result);
		});
	});
	return deferred.promise;
}

function update(tag_name, count) {
	var deferred = Q.defer();

	// find_or_create(db, tag_name, function(err, result) {
	// 	if (result != undefined) {
	// 		update_by_id(db, result.id, count).done(deferred.resolve());
	// 	}

	// });
	find_or_create(tag_name).done(function(results) {
		if (results.length > 0) {
			var id = results[0].id;
			update_by_id(id, count).done(function(results) {
				deferred.resolve(results);
			});
		}
	});
	return deferred.promise;
}

function update_by_id(id, count) {
	var deferred = Q.defer();

	// db.serialize(function() {
	// 	var stmt = db.prepare('update tags set count=count+? where id=?');
	// 	stmt.run(count, id);
	// 	stmt.finalize();
	// 	deferred.resolve()
	// });
	pool.getConnection(function(err, connection) {
		// Use the connection
		var sql = "update tags set count=count+" + count + " where id=" + id;
		console.log(sql);
		connection.query(sql, function(err, result) {
			if (err) throw err;
			connection.release();
			deferred.resolve(result);
		});
	});

	return deferred.promise;
}

// exports.find_or_create = function(tag_name, cb) {
// 	var db = new sqlite3.Database('db/dev.sqlite3');

// 	find_or_create(db, tag_name, function(err, result) {
// 		cb(err, result);
// 		db.close();
// 	});
// }

function find_or_create(tag_name, cb) {
	var deferred = Q.defer();

	find(tag_name).done(function(results) {
		if (results > 0) {
			deferred.resolve(results);
		} else {
			create(tag_name).done(
				function(id) {
					var results = [{
						id: id
					}];
					deferred.resolve(results);
				});
		}
	});
	return deferred.promise;
}