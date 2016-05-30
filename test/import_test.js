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

QUnit.test("Allows a relative main", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "./relative.js",
			version: "1.0.0"
		})
		.withModule("relative", "module.exports = 'worked'")
		.loader;
	
	loader["import"]("package.json!npm")
	.then(function(){
		return loader["import"](loader.main);
	})
	.then(function(app){
		assert.equal(app, "worked", "it loaded correctly");
	})
	.then(null,function(err) { console.log(err); })
	.then(done, done);
});

QUnit.test("Default npm algorithm", function (assert) {
	var done = assert.async();

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				"dep1": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep1",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					"dep2": "1.0.0"
				}
			},
			{
				name: "dep2",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.withModule("dep1@1.0.0#main", "module.exports = require('dep2');")
		.withModule("dep2@1.0.0#main", "module.exports = 'loaded';")
		.withModule("app@1.0.0#main", "module.exports = require('dep1');");

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(val){
			assert.equal(runner.npmVersion(), 3, "we assume that the default npm version is higher or equal 3");
			assert.equal(val, "loaded", "dependencies loaded");
			assert.equal(loader.npmAlgorithm, "flat", "default npm algorithm is flat");
			assert.equal(loader.npmContext.isFlatFileStructure, true, "default isFlatFileStructure is 'true'")
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});

QUnit.test("Nested npm algorithm (< npm 3)", function (assert) {
	var done = assert.async();

	var runner = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			system: {
				npmAlgorithm: "nested"
			},
			dependencies: {
				"dep1": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep1",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					"dep2": "1.0.0"
				}
			},
			{
				name: "dep2",
				version: "1.0.0",
				main: "main.js"
			}
		])
		.withModule("dep1@1.0.0#main", "module.exports = require('dep2');")
		.withModule("dep2@1.0.0#main", "module.exports = 'loaded';")
		.withModule("app@1.0.0#main", "module.exports = require('dep1');");

	var loader = runner.loader;

	loader["import"]("app")
		.then(function(val){
			assert.equal(runner.isFlat(), false, "with npm algorithm=nested, npm have to be '2.15.5' or less");
			assert.equal(val, "loaded", "dependencies loaded");
			assert.equal(loader.npmAlgorithm, "nested", "npm algorithm is nested");
			assert.equal(loader.npmContext.isFlatFileStructure, false, "isFlatFileStructure is 'false'")
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
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

QUnit.module("Importing packages with /index convention");

QUnit.test("Retries with /index", function(assert){
	var done = assert.async();

	var appModule = "module.exports = { worked: true };";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#foo/index", appModule)
		.loader;

	loader["import"]("app/foo")
	.then(function(mod){
		assert.ok(mod.worked, "it loaded the index variant");
	})
	.then(done, done);
});

QUnit.test("Retries /package convention as well", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#package.json", "module.exports = 'works'")
		.loader;

	loader["import"]("./package", { name : "app@1.0.0#main" })
	.then(function(mod){
		assert.equal(mod, "works", "loaded the package.json");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Doesn't retry non-npm module names", function(assert){
	var done = assert.async();

	var appModule = "module.exports = { worked: true };";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("node_modules/foo/package.json/index", "module.exports={}")
		.loader;

	var retried = false;

	loader["import"]("node_modules/foo/package.json")
	.then(null, function(err){
		assert.ok(err, "Got an error, didn't retry");
	})
	.then(done, done);
});

QUnit.test("Retries when using the forward slash convention", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#lib/index", "module.exports = 'works'")
		.loader;

	loader["import"]("./lib/", { name: "app@1.0.0#main" })
	.then(function(mod){
		assert.equal(mod, "works", "imported the module");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Doesn't retry the forward slash convention in production", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#main", "module.exports = 'works'")
		.withModule("app@1.0.0#lib/index", "module.exports = 'works'")
		.loader;

	loader["import"]("app")
	.then(function(){
		delete loader.npmContext;

		return loader["import"]("./lib/", { name: "app@1.0.0#main" });
	})
	.then(null, function(err){
		assert.ok(err, "Got an error because we don't do retries in Prod");
	})
	.then(done, helpers.fail(assert, done));
});


QUnit.module("Importing globalBrowser config");

QUnit.test("Correctly imports globalBrowser package that is depended on by another", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				"dep": "1.0.0",
				"steal-builtins": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "steal-builtins",
				main: "main.js",
				version: "1.0.0",
				globalBrowser: {
					"readline": "./thing",
					"http": "http"
				},
				dependencies: {
					"http": "0.10.0"
				}
			},
			{
				name: "dep",
				version: "1.0.0",
				main: "main.js"
			},
			{
				name: "http",
				version: "0.10.0",
				main: "main.js"
			}
		])
		.withModule("http@0.10.0#main", "module.exports = 'http';")
		.withModule("steal-builtins@1.0.0#thing", "module.exports = require('http');")
		.withModule("dep@1.0.0#main", "module.exports = require('readline');")
		.withModule("app@1.0.0#main", "module.exports = require('dep');")
		.loader;

	
	loader["import"]("app")
		.then(function(val){
			assert.equal(val, "http", "correctly got the http module");
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});
