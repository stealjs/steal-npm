
function Runner(System){
	this.BaseSystem = System;
	this.deps = [];
}

Runner.prototype.clone = function(){
	var System = this.BaseSystem;
	var loader = this.loader = System.clone();
	loader.npm = {};
	loader.npmPaths = {};
	loader.globalBrowser = {};
	var loadMod = System.get("npm-load");
	var crawlMod = System.get("npm-crawl");
	loader.npmContext = {
		loader: loader,
		fetchCache: {},
		deferredConversions: {},
		versions: {},
		npmLoad: getDefault(loadMod),
		crawl: getDefault(crawlMod),
		paths: {}
	};

	this.rootPackage({
		name: "npm-test",
		main: "main.js",
		version: "1.0.0"
	})

	return this;
};

Runner.prototype.rootPackage = function(pkg){
	var loader = this.loader;
	var fileUrl = pkg.fileUrl = ".";

	loader.npmPaths.__default = pkg;
	loader.npmPaths[fileUrl] = pkg;

	return this;
};

Runner.prototype.withPackages = function(packages){
	// Do something to initialize these packages
	var deps = this.deps = packages.map(function(pkg){
		return (pkg instanceof Package) ? pkg : new Package(pkg);
	});

	var loader = this.loader;
	var npm = loader.npm;
	var context = loader.npmContext;
	deps.forEach(function(package){
		var pkg = package.pkg;
		// This is wrong
		pkg.fileUrl = "./node_modules/" + pkg.name;
		npm[pkg.name] = pkg;
		npm[pkg.name+"@"+pkg.version] = pkg;

		var versions = context.versions;
		var v = versions[pkg.name] = versions[pkg.name] || {};
		v[pkg.version] = pkg;

		context.paths[pkg.fileUrl + "/package.json"] = pkg;
	});

	return this;
};

Runner.prototype.withConfig = function(cfg){
	this.loader.config(cfg);
	return this;
};

function Package(pkg){
	this.pkg = pkg;
	this.deps = [];
}

Package.prototype.deps = function(deps){
	this.deps = deps;
	return this;
};

function getDefault(module){
	return module.__useDefault ? module["default"] : module;
}

module.exports = function(System){
	return {
		clone: function(){
			return new Runner(System).clone();
		},
		Package: Package,
		package: function(pkg){
			return new Package(pkg);
		}
	};
};
