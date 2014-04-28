var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
	db.createTable('tags', {
		id: {
			type: 'int',
			primaryKey: true,
			autoIncrement: true
		},
		name: 'string',
		count: 'int'
	}, callback);
};

exports.down = function(db, callback) {
	db.dropTable('tags', callback);
};