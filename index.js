var Converter = require("csvtojson").core.Converter;
var fs = require("fs");

// var csvFileName = "/Users/ocowchun/Downloads/Train.csv";
var csvFileName="test.csv"
var fileStream = fs.createReadStream(csvFileName);
//new converter instance
var csvConverter = new Converter({
	constructResult: false
});
var started = false;

//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed", function(jsonObj) {
	// console.log(jsonObj); //here is your result json object
});


csvConverter.on("record_parsed", function(rowJSON) {
	var result = JSON.stringify(rowJSON);
	var fileName = "datas/outpuData" + Date.now() + ".json";
	var writeStream = require("fs").createWriteStream(fileName);
	writeStream.write(result); //write parsed JSON object one by one.
	if (started == false) {
		started = true;
	}
});
//read from file
fileStream.pipe(csvConverter);
