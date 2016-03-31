var crawl = require("npm-crawl");

QUnit.module("npm-crawl/getDependencyMap");

QUnit.test("Returns the correct dependencies for " +
		   "a package with peer deps", function(assert){

	var pkg = {
	 "name": "angular2",
	 "version": "2.0.0-beta.12",
	 "fileUrl": "./node_modules/angular2/package.json",
	 "peerDependencies": {
	  "es6-shim": "^0.35.0",
	  "reflect-metadata": "0.1.2",
	  "rxjs": "5.0.0-beta.2",
	  "zone.js": "^0.6.6"
	 }
	};

	var map = crawl.getDependencyMap(System, pkg, false);

	assert.equal(map["rxjs"].name, "rxjs", "correctly mapped peer dep");
});
