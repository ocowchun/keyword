var fs = require("fs");

if (fs.existsSync("errors")) {
	fs.rmdir("errors");
}

if (fs.existsSync("datas")) {

	fs.rmdir("datas");
}

fs.mkdir("datas");
fs.mkdir("errors");


