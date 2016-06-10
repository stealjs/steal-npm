var helpers = require("./helpers")(System);
var utils = require("npm-utils");

QUnit.module("package.json load object");

QUnit.test("System.main contains the package name without directories.lib",
		   function(assert){
	var done = assert.async();
	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js"
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		assert.equal(loader.main, "app@1.0.0#main", "correctly normalized");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("System.main contains the package name with directories.lib",
		   function(assert){
	var done = assert.async();
	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			system: {
				directories: {
					lib: "src"
				}
			}
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		assert.equal(loader.main, "app@1.0.0#main", "correctly normalized");
	})
	.then(done, helpers.fail(assert, done));
});
