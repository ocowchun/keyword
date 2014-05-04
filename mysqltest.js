var config = require('./config/mysql_config').config;


// var mysql      = require('mysql');
// var connection = mysql.createConnection(;

// connection.connect(function(err) {
//   if (err) {
//     console.error('error connecting: ' + err.stack);
//     return;
//   }

//   console.log('connected as id ' + connection.threadId);
// });

var mysql = require('mysql');
var pool = mysql.createPool(config);

// pool.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
// 	if (err) throw err;

// 	console.log('The solution is: ', rows[0].solution);
// });

// pool.on('connection', function(connection) {
// 	connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
// 		if (err) throw err;

// 		console.log('The solution is: ', rows[0].solution);
// 	});
// });

pool.getConnection(function(err, connection) {
	// Use the connection
	connection.query('SELECT * FROM teams limit 10', function(err, rows) {
		// And done with the connection.
		console.log("fuck");
		connection.release();
		pool.end();
	});
});