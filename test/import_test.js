var helpers = require("./helpers")(System);

QUnit.module("Importing npm modules");

QUnit.test("process.cwd()", function(assert){
	var done = assert.async();

	var appModule = "module.exports = process.cwd();";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#main", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(typeof app, "string", "process.cwd is a string");
		assert.equal(app[app.length - 1], "/", "ends in a slash");
	})
	.then(done, done);
});
