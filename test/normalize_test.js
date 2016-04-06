var helpers = require("./helpers")(System);

QUnit.module("normalizing");

QUnit.test("basics", function(assert){
	var done = assert.async();

	System.normalize("foo").then(function(name){
		assert.equal(name, "foo", "Got the right name");
		done();
	});
});

QUnit.test("normalizes child package names", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0"
		})
		.withPackages([
			{
				name: "child",
				main: "main.js",
				version: "1.0.0"
			}
		]).loader;

	loader.normalize("child", "parent@1.0.0#main")
	.then(function(name){
		assert.equal(name, "child@1.0.0#main", "Normalized to the parent");
	})
	.then(done, done);
});

QUnit.test("a package with .js in the name", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0"
		})
		.withPackages([
			{
				name: "foo.js",
				main: "foo.js",
				version: "0.0.1"
			}
		]).loader;

	loader.normalize("foo.js", "parent#1.0.0#main")
	.then(function(name){
		assert.equal(name, "foo.js@0.0.1#foo", "Correctly normalized");
	})
	.then(done, done);
});

QUnit.test("normalizes a package with peer deps", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				dep: "1.0.0",
				peer: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				main: "main.js",
				version: "1.0.0",
				peerDependencies: {
					peer: "1.0.0"
				}
			},
			{
				name: "peer",
				main: "main.js",
				version: "1.0.0"
			}
		]).loader;

		// Delete this so it has to be fetched
		delete loader.npm.peer;

		loader.normalize("peer", "dep@1.0.0#main")
		.then(function(name){
			assert.equal(name, "peer@1.0.0#main", "normalized peer");
		})
		.then(done, done);
});

QUnit.test("Can load two separate versions of same package", function(assert){
	var done = assert.async();
	var Package = helpers.Package;

	var loader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "parent",
			main: "main.js",
			version: "1.0.0",
			dependencies: {
				"fixture": "1.0.0",
				"connect": "1.0.0"
			}
		})
		.withPackages([
			new Package({
				name: "fixture",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"set": "^3.0.0"
				}
			}).deps([
				new Package({
					name: "set",
					main: "main.js",
					version: "3.0.4"
				}, false)
			]),
			{
				name: "connect",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"set": "^5.0.0"
				}
			},
			new Package({
				name: "set",
				main: "main.js",
				version: "5.0.4"
			}, false)
		])
		.loader;

	loader.normalize("set", "fixture@1.0.0#main")
	.then(function(name){
		assert.equal(name, "set@3.0.4#main", "Got the correct version of set");
	})
	.then(done, done);
});
