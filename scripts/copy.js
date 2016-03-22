var copy = require("copy-dir").sync;

var files = [
	"npm.js",
	"npm-crawl.js",
	"npm-convert.js",
	"npm-extension.js",
	"npm-load.js",
	"npm-utils.js"
];

files.forEach(function(src){
	var dest = "node_modules/steal/ext/" + src;
	copy(src, dest);
});
