var helpers = require("./helpers")(System);
var Package = helpers.Package;

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
			version: "1.0.0",
			dependencies: {
				child: "1.0.0"
			}
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
			version: "1.0.0",
			dependencies: {
				"foo.js": "0.0.1"
			}
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

		loader.normalize("peer", "dep@1.0.0#main")
		.then(function(name){
			assert.equal(name, "peer@1.0.0#main", "normalized peer");
		})
		.then(done, done);
});

QUnit.test("Can load two separate versions of same package", function(assert){
	var done = assert.async();

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
			{
				name: "connect",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"set": "^5.0.0"
				}
			},
			{
				name: "set",
				main: "main.js",
				version: "5.0.4"
			},
			new Package({
				name: "fixture",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"set": "^3.0.0"
				}
			}).deps([
				{
					name: "set",
					main: "main.js",
					version: "3.0.4"
				}
			])
		])
		.loader;

	loader.normalize("set", "fixture@1.0.0#main")
	.then(function(name){
		assert.equal(name, "set@3.0.4#main", "Got the correct version of set");
	})
	.then(done, done);
});

QUnit.test("When applying late-bound config, only applies config related to the new package", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "parent",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				dep: "1.0.0"
			}
		})
		.withPackages([
			{
				name: "dep",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					other: "1.0.0"
				},
				system: {
					map: {
						"dep/child": "@empty",
						"other": "other/other"
					}
				}
			},
			{
				name: "other",
				main: "main.js",
				version: "1.0.0"
			}
		])
		.loader;

	loader.normalize("dep/child", "parent@1.0.0#main")
	.then(function(name){
		assert.equal(name, "@empty", "Map was applied");

		// reset the map so that it is back to being the original value.
		loader.config({
			map: {
				"dep/child": "dep/child"
			}
		});

		return loader.normalize("dep/child", "parent@1.0.0#main");
	})
	.then(function(name){
		assert.equal(name, "dep@1.0.0#child", "Config reset the value");

		// Now load `other` which will cause `dep`'s config to be re-applied.
		return loader.normalize("other", "dep@1.0.0#main").then(function(){
			// And re-normalize child again
			return loader.normalize("dep/child", "parent@1.0.0#main");
		});
	})
	.then(function(name){
		assert.equal(name, "dep@1.0.0#child", "The name hasn't changed");
	})
	.then(done, done);
});

QUnit.module("normalizing with main config");

var mainVariations = {
	"system.main": function(pkg){
		pkg.system = {
			main: "bar"
		};
	},

	"pkg.main": function(pkg){
		pkg.main = "bar.js";
	},

	"browser string": function(pkg){
		pkg.browser = "bar.js";
	},

	"browser string ending with slash": function(pkg){
		pkg.browser = "bar/";
		return "bar/index";
	},

	"browserify string": function(pkg){
		pkg.browserify = "bar";
	},

	"jam.main": function(pkg){
		pkg.jam = {
			main: "./bar.js"
		};
	}
};

Object.keys(mainVariations).forEach(function(testName){
	var definer = mainVariations[testName];

	QUnit.test(testName, function(assert){
		var done = assert.async();

		var deepPackageJSON = {
			name: "deep",
			main: "foo.js",
			version: "1.0.0",
		};
		var modulePath = definer(deepPackageJSON) || "bar";

		var loader = helpers.clone()
			.npmVersion(3)
			.rootPackage({
				name: "parent",
				main: "main.js",
				version: "1.0.0",
				dependencies: {
					"child": "1.0.0"
				}
			})
			.withPackages([
				new Package({
					name: "child",
					main: "main.js",
					version: "1.0.0",
					dependencies: {
						"deep": "1.0.0"
					}
				}).deps([
					deepPackageJSON
				])
			])
			.loader;

		loader.normalize("deep", "child@1.0.0#main")
		.then(function(name){
			assert.equal(name, "deep@1.0.0#" + modulePath, "Correctly normalized");
		})
		.then(done, done);
	});
});
