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

	_.each(tags, function(tag) {
		update(tag.name, tag.count).done(function() {
			current++;
			if (current == max) {
				close();
				deferred.resolve();
			}
		});
	});
	return deferred.promise;
}

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


function find_or_create(tag_name, cb) {
	var deferred = Q.defer();

	find(tag_name).done(function(results) {
		if (results.length > 0) {
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