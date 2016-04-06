
function Runner(System){
	this.BaseSystem = System;
	this.deps = [];
}

Runner.prototype.clone = function(){
	var runner = this;
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
		packages: [],
		pkgInfo: [],
		paths: {}
	};

	// Keep a copy of each package.json in this scope
	this.packagePaths = {};

	// Override loader.fetch and return packages that are part of this loader
	var fetch = loader.fetch;
	loader.fetch = function(load){
		var pkg = runner.packagePaths[load.address];
		if(pkg) {
			var json = JSON.stringify(pkg);
			return Promise.resolve(json);
		}
		return fetch.call(this, load);
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

/**
 * Add packages to the cloned loader. Packages can either be preloaded or not
 * by default they are. This function will add all of the appropriate config
 * to the loader for each scenario.
 */
Runner.prototype.withPackages = function(packages){
	// Do something to initialize these packages
	var deps = this.deps = packages.map(function(pkg){
		return (pkg instanceof Package) ? pkg : new Package(pkg);
	});

	var runner = this;
	var loader = this.loader;
	var npm = loader.npm;
	var context = loader.npmContext;
	deps.forEach(function(package){
		addPackage(package);
	});

	function addPackage(package, parentPackage){
		// If this is an unloaded package
		if(!package.loaded) {
			return addUnloadedPackage(package, parentPackage);
		}

		var pkg = package.pkg;
		if(parentPackage) {
			pkg.fileUrl = parentPackage.pkg.fileUrl + "/node_modules/" + pkg.name;
		} else {
			pkg.fileUrl = "./node_modules/" + pkg.name;
		}

		npm[pkg.name] = pkg;
		npm[pkg.name+"@"+pkg.version] = pkg;

		var versions = context.versions;
		var v = versions[pkg.name] = versions[pkg.name] || {};
		v[pkg.version] = pkg;

		var pkgUrl = pkg.fileUrl + "/package.json";
		runner.packagePaths[pkgUrl] = context.paths[pkgUrl] = pkg;

		package.forEachDeps(function(childPackage){
			addPackage(childPackage, package);
		});
	}

	function addUnloadedPackage(package, parentPackage){
		var pkg = package.pkg;

		if(parentPackage) {
			pkg.fileUrl = parentPackage.pkg.fileUrl + "/node_modules/" + pkg.name;
		} else {
			pkg.fileUrl = "./node_modules/" + pkg.name;
		}

		var pkgUrl = pkg.fileUrl + "/package.json";
		runner.packagePaths[pkgUrl] = pkg;
	}

	return this;
};

Runner.prototype.withConfig = function(cfg){
	this.loader.config(cfg);
	return this;
};

Runner.prototype.npmVersion = function(version){
	this.loader.npmContext.isFlatFileStructure = version >= 3;
	return this;
};

function Package(pkg, loaded){
	this.pkg = pkg;
	this._deps = [];
	this.loaded = loaded !== false;
	this._unloadedDeps = [];
}

Package.toPackage = function(pkg){
	return (pkg instanceof Package) ? pkg : new Package(pkg)
};

Package.prototype.deps = function(deps){
	this._deps = this._deps.concat(deps.map(Package.toPackage));
	return this;
};

Package.prototype.forEachDeps = function(callback){
	var deps = this._deps;
	for(var i = 0, len = deps.length; i < len; i++) {
		callback(deps[i]);
	}
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
