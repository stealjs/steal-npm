
function Runner(System){
	this.BaseSystem = System;
	this.deps = [];
}

Runner.prototype.clone = function(){
	var loader = this.loader = this.BaseSystem.clone();
	loader.npm = {};
	loader.npmPaths = {};

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
	deps.forEach(function(package){
		var pkg = package.pkg;
		npm[pkg.name] = pkg;
		npm[pkg.name+"@"+pkg.version] = pkg;
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

module.exports = function(System){
	return {
		clone: function(){
			return new Runner(System).clone();
		}
	};
};
