var config = require('../../config/mysql_config').config;
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

exports.update = function(tag_words) {
	var deferred = Q.defer();
	open();
	var current = 0,
		max = tag_words.length;

	// db.serialize(function() {
	_.each(tag_words, function(word) {
		update(word).done(function() {
			current++;
			if (current == max) {
				close();
				deferred.resolve();
			}
		});
	});
	// });
	return deferred.promise;
}

function update(word) {
	var deferred = Q.defer();
	var content = word.content,
		tag_name = word.tag_name,
		count = word.count;
	find_or_create(content, tag_name).done(function(results) {
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

	pool.getConnection(function(err, connection) {
		var sql = 'update tag_words set count=count+? where id=?';
		connection.query(sql, [count, id], function(err, result) {
			if (err) throw err;
			connection.release();
			deferred.resolve(result);
		});
	});

	return deferred.promise;
}



function find_or_create(word, tag_name) {
	var deferred = Q.defer();
	find(word, tag_name).done(function(results) {
		if (results.length > 0) {
			deferred.resolve(results);
		} else {
			create(word, tag_name).done(
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



function create(word, tag_name) {
	var deferred = Q.defer();
	pool.getConnection(function(err, connection) {
		// Use the connection
		var sql = 'INSERT INTO tag_words(content,tag_name,count) VALUES (?,?,?)';
		connection.query(sql, [word, tag_name, 0], function(err, result) {
			if (err) throw err;
			connection.release();
			deferred.resolve(result.insertId);
		});
	});
	return deferred.promise;
}

function find(word, tag_name) {
	var deferred = Q.defer();
	pool.getConnection(function(err, connection) {
		// Use the connection
		var sql = "select id from tag_words where tag_name = ? and content= ?";
		connection.query(sql, [tag_name, word], function(err, result) {
			if (err) throw err;
			connection.release();
			deferred.resolve(result);
		});
	});
	return deferred.promise;
}