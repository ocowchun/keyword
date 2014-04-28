var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
	db.createTable('tag_words', {
		id: {
			type: 'int',
			primaryKey: true,
			autoIncrement: true
		},
		content: 'string',
		tag_name: 'string',
		count: 'int'
	}, callback);
};

exports.down = function(db, callback) {
	db.dropTable('tag_words', callback);
};