var _ = require('underscore')
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var csvFileName = "/Users/ocowchun/Downloads/Train.csv";
// var csvFileName="test.csv";

var instream = fs.createReadStream(csvFileName);
var outstream = new stream;
var rl = readline.createInterface(instream, outstream);


var fileContent = "";
var lineCount = 0;


rl.on('line', function(line) {
	// process line here

	//new row
	// if (isID(line)) {
	// 	writeFile(fileContent);
	// 	fileContent = "";
	// 	lineCount = 0;
	// }
	// if (lineCount > 15) {
	// 	writeErrorFile(fileContent);
	// 	fileContent = "";
	// 	lineCount = 0;
	// }

	if (lineCount > 100) {
		writeErrorFile(fileContent);
		fileContent = "";
		lineCount = 0;
	}

	fileContent += line+"\n";
	lineCount++;
});


rl.on('close', function() {
	// do something on finish here
	writeFile(fileContent);
});


function isID(line) {
	var result = line[0] == '"' && isNormalInteger(line[1])

	return result;
}

function isNormalInteger(str) {
	return /^\+?(0|[1-9]\d*)$/.test(str);
}


function writeErrorFile(result) {
	var fileName = "errors/outpuData" + Date.now() + ".json";
	var writeStream = require("fs").createWriteStream(fileName);
	writeStream.write(result);
}

function writeFile(result, isError) {
	var fileName = "datas/outpuData" + Date.now() + ".json";
	var writeStream = require("fs").createWriteStream(fileName);
	writeStream.write(result);
}