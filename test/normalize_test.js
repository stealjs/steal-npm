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
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Configures a package when conflicting package.jsons are progressively loaded", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				"steal-focha": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "focha",
				version: "1.0.0",
				main: "main.js"
			},
			new Package({
				name: "steal-focha",
				version: "1.0.0",
				main: "main.js",
				dependencies: {
					"focha": "^2.0.0"
				},
				system: {
					map: {
						focha: "focha#./other"
					}
				}
			}).deps([
				{
					name: "focha",
					version: "2.0.0",
					main: "main.js"
				}
			])
		])
		.loader;

	loader.normalize("focha", "steal-focha@1.0.0#main")
	.then(function(name){
		assert.equal(name, "focha@2.0.0#other", "config applied");
	})
	.then(done, done);
});

QUnit.test("Loads npm convention of folder with trailing slash", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				dep: "1.0.0"
			}
		})
		.withPackages([{
			name: "dep",
			version: "1.0.0",
			main: "main.js"
		}])
		.loader;

	// Relative to a nested module
	loader.normalize("./", "dep@1.0.0#folder/deep/mod")
	.then(function(name){
		// Relative to current folder uses index
		assert.equal(name, "dep@1.0.0#folder/deep/index");

		// Loading the parent
		return loader.normalize("../", "dep@1.0.0#folder/deep/mod");
	})
	.then(function(name){
		// Relative to the parent folder uses index
		assert.equal(name, "dep@1.0.0#folder/index");

		// Loading to the parent-most folder of the package
		return loader.normalize("../", "dep@1.0.0#folder/mod");
	})
	.then(function(name){
		// Relative to parent-most is the pkg.main
		assert.equal(name, "dep@1.0.0#main");

		return loader.normalize("./", "dep@1.0.0#thing");
	})
	.then(function(name){
		assert.equal(name, "dep@1.0.0#main");
	})
	.then(done, done);
});

QUnit.test("Race conditions in loading deps are resolved", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.npmVersion(2)
		.rootPackage({
			name: "app",
			version: "1.0.0",
			dependencies: {
				"dep1": "1.0.0"
			}
		})
		.withPackages([
			new Package({
				name: "dep1",
				version: "1.0.0",
				dependencies: {
					"dep2": "1.0.0",
					"dep3": "2.0.0"
				}
			}).deps([
				new Package({
					name: "dep2",
					version: "1.0.0",
					dependencies: {
						"dep3": "1.0.0"
					}
				}),
				new Package({
					name: "dep3",
					version: "1.0.0"
				})
			]),
			new Package({
				name: "dep3",
				version: "2.0.0"
			})
		])
		.loader;

	loader.normalize("dep2", "dep1@1.0.0#index")
	.then(function(name){
		var one = loader.normalize("dep3", "dep1@1.0.0#index")
			.then(function(name){
				assert.equal(name, "dep3@2.0.0#index");
			});

		var two = loader.normalize("dep3", "dep2@1.0.0#index")
			.then(function(name){
				assert.equal(name, "dep3@1.0.0#index");
			});

		Promise.all([one, two]).then(done, helpers.fail(assert, done));
	});
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
