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

QUnit.module("Importing npm modules using 'browser' config");

QUnit.test("Array property value", function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'bar';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			browserify: {
				transform: [
					"loose-envify"
				]
			}
		})
		.withModule("app@1.0.0#main", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(app, "bar", "loaded the app");
	})
	.then(done, done);
});

QUnit.test("Specifies a different main", function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'bar';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			browserify: "app.js"
		})
		.withModule("app@1.0.0#app", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(app, "bar", "loaded the app");
	})
	.then(done, done);

});
