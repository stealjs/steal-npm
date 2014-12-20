"format cjs";

// TODO: cleanup removing package.json
var SemVer = require('./semver');

// Add @loader, for SystemJS
if(!System.has("@loader")) {
	System.set('@loader', System.newModule({'default':System, __useDefault: true}));
}

// Don't bother loading these dependencies
System.npmDev = true;


// module name and path helpers

function endsWithSlash(path){
	return path[path.length -1] === "/";
}
function removeTrailingSlash( path ) {
	if(endsWithSlash(path)) {
		return path.substr(0, path.length -1);
	} else {
		return path;
	}
}
function removeLeadingDotSlash( path ) {
	if(path.substr(0,2) === "./") {
		return path.substr(2);
	} else {
		return path;
	}
}
function joinURL(baseURL, url){
	baseURL = removeTrailingSlash(baseURL);
	url = removeLeadingDotSlash(url);
	return baseURL+"/"+url;
}

function packageFolderAddress(address){
	var nodeModules = "/node_modules/",
		nodeModulesIndex = address.lastIndexOf(nodeModules),
		nextSlash = address.indexOf("/", nodeModulesIndex+nodeModules.length);
	if(nodeModulesIndex >= 0) {
		return nextSlash>=0 ? address.substr(0, nextSlash) : address;
	}
}
// gives the parent node_module folder address
function parentNodeModuleAddress(address) {
	var nodeModules = "/node_modules/",
		nodeModulesIndex = address.lastIndexOf(nodeModules),
		prevModulesIndex = address.lastIndexOf(nodeModules, nodeModulesIndex-1);
	if(prevModulesIndex >= 0) {
		return address.substr(0, prevModulesIndex+nodeModules.length - 1 );
	}
}
function childPackageAddress(parentPackageAddress, childName){
	var packageFolderName = parentPackageAddress.replace(/\/package\.json.*/,"");
	return (packageFolderName ? packageFolderName+"/" : "")+"node_modules/" + childName + "/package.json";
}


/**
 * @function fetch
 * @description Implement fetch so that we can warn the user in case of a 404.
 * @signature `fetch(load)`
 * @param {Object} load Load object
 * @return {Promise} a promise to resolve with the load's source
 */
exports.fetch = function(load){
	var loader = this;
	return Promise.resolve(this.fetch(load)).then(null, function(msg){
		if(/Not Found/.test(msg)) {
			var packageName = /\/(.+?)\/bower\.json/.exec(load.name)[1];
			console.log("Unable to load the bower.json for", packageName);
		}
		return "";
	});
};


System.npmPackages = {};
function findPackageByAddress(loader, parentAddress) {
	if(loader.npm) {
		if(parentAddress) {
			var packageFolder = packageFolderAddress(parentAddress);
			return packageFolder ? loader.npmPaths[packageFolder] : loader.npmPaths.__default;
		} else {
			return loader.npmPaths.__default
		}
	}
	
}
function findPackage(loader, name) {
	if(loader.npm) {
		
	}
}
function findDepPackage(loader, refPackage, name) {
	if(loader.npm && refPackage) {
		// Todo .. first part of name
		var curPackage = childPackageAddress(refPackage.fileUrl, name).replace(/\/package\.json.*/,"");
		while(curPackage) {
			var pkg = loader.npmPaths[curPackage];
			if(pkg) {
				return pkg;
			}
			var parentAddress = parentNodeModuleAddress(curPackage);
			if(!parentAddress) {
				return;
			}
			curPackage = parentAddress+"/"+pkg.name;
		}
	}
}


var oldNormalize = System.normalize;
System.normalize = function(name, parentName, parentAddress){
	var refPkg = findPackageByAddress(this, parentAddress), 
		depPkg = findDepPackage(this, refPkg, name);

	if (!depPkg) {
		depPkg = findPackage(this, name);
	}
	if(!depPkg) {
		return oldNormalize.call(this, name, parentName, parentAddress);
	} else {
		return name+"@"+depPkg.version;
		
		/*if (name === depPkg.name && depPkg.main) {
			//normalized = depPkg.main.charAt(0) === '.'
			//	? path.reduceLeadingDots(depPkg.main, path.ensureEndSlash(depPkg.name))
			//	: path.joinPaths(depPkg.name, depPkg.main);
		}*/
	}
};

var oldLocate = System.locate;
System.locate = function(load){
	var atIndex = load.name.indexOf("@");
	// @ is not the first character
	if(atIndex > 0 && this.npm) {
		var pkg = this.npm[load.name];
		if(pkg) {
			return joinURL( packageFolderAddress(pkg.fileUrl), pkg.main || "main.js");
		}
	}
	return oldLocate.call(this, load);
};


function addDeps(packageJSON, dependencies, deps){
	for(var name in dependencies) {
		if(!packageJSON.system || !packageJSON.system.npmIgnore || !packageJSON.system.npmIgnore[name]) {
			deps[name] = {name: name, version: dependencies[name]};
		}
	}
}

// Combines together dependencies and devDependencies (if npmDev option is enabled)
function getDependencies(loader, packageJSON){
	var deps = {};
	
	addDeps(packageJSON, packageJSON.peerDependencies || {}, deps);
	addDeps(packageJSON, packageJSON.dependencies || {}, deps);
	// Only get the devDependencies if this is the root bower and the 
	// `npmDev` option is enabled
	if(loader.npmDev && !loader._npmMainLoaded) {
		addDeps(packageJSON, packageJSON.devDependencies || {}, deps);
		loader._npmMainLoaded = true;
	}
	
	var dependencies = [];
	for(var name in deps) {
		dependencies.push(deps[name]);
	}
	
	return dependencies;
};

/**
 * @function translate
 * @description Convert the package.json file into a System.config call.
 * @signature `translate(load)`
 * @param {Object} load Load object
 * @return {Promise} a promise to resolve with the load's new source.
 */
exports.translate = function(load){
	// This could be an empty string if the fetch failed.
	if(load.source == "") {
		return "define([]);";
	}
	// 
	var context = {
		packages: [],
		loader: this,
		// places we
		paths: {},
		versions: {}
	};
	var pkg = {origFileUrl: load.address, fileUrl: load.address};
	
	processPkg(context, pkg, load.source);
	
	return processDeps(context, pkg).then(function(){
		// clean up packages so everything is unique
		var names = {};
		var packages = [];
		context.packages.forEach(function(pkg){
			if(!packages[pkg.name+"@"+pkg.version]) {
				packages.push({
					name: pkg.name,
					version: pkg.version,
					fileUrl: pkg.fileUrl,
					main: pkg.main
				});
				packages[pkg.name+"@"+pkg.version] = true;
			}
		});
		return "define(['@loader'], function(loader){\n" +
			"("+translateConfig.toString()+")(loader, "+JSON.stringify(packages, null, " ")+");\n" +
		"});";
	});
};

var extend = function(d, s){
	for(var prop in s) {
		d[prop] = s[prop];
	}
	return d;
};

function isSameRequestedVersionFound(context, childPkg) {
	if(!context.versions[childPkg.name]) {
		context.versions[childPkg.name] = {};
	}
	var versions = context.versions[childPkg.name];
	if(!versions[childPkg.version]) {
		versions[childPkg.version] = childPkg;
	} else {
		// add a placeholder at this path
		context.paths[childPkg.origFileUrl] = versions[childPkg.version];
		return true;
	}
}

function hasParentPackageThatMatches(context, childPkg){
	// check paths
	var parentAddress = parentNodeModuleAddress(childPkg.origFileUrl);
	while(parentAddress) {
		var packageAddress = parentAddress+"/"+childPkg.name+"/package.json";
		var parentPkg = context.paths[packageAddress];
		if(parentPkg) {
			if(SemVer.satisfies(parentPkg.version, childPkg.version)) {
				return parentPkg;
			}
		}
		parentAddress = parentNodeModuleAddress(packageAddress);
	}
}

function truthy(x) {
	return x;
}
function processDeps(context, pkg) {
	var deps = getDependencies(context.loader, pkg);
	return Promise.all(deps.map(function(childPkg){

		childPkg.origFileUrl = childPackageAddress(pkg.fileUrl, childPkg.name);
		
		// check if childPkg matches a parent's version ... if it does ... do nothing
		if(hasParentPackageThatMatches(context, childPkg)) {
			return;
		}
		
		if(isSameRequestedVersionFound(context, childPkg)) {
			return;
		}
		
		
		
		// otherwise go get child ... but don't process dependencies until all of these dependencies have finished
		return npmLoad(context, childPkg).then(function(source){
			if(source) {
				return processPkg(context, childPkg, source);
			} // else if there's no source, it's likely because this dependency has been found elsewhere
		});
		
	}).filter(truthy)).then(function(packages){
		// at this point all dependencies of pkg have been loaded, it's ok to get their children

		return Promise.all(packages.map(function(childPkg){
			if(childPkg) {
				return processDeps(context, childPkg);
			} 
		}).filter(truthy));
	});
}

function processPkg(context, pkg, source) {
	var packageJSON = JSON.parse(source);
	extend(pkg, packageJSON);
	context.packages.push(pkg);
	return pkg;
}


// Loads package.json
// if it finds one, it sets that package in paths
// so it won't be loaded twice.
function npmLoad(context, pkg, fileUrl){
	fileUrl = fileUrl || pkg.origFileUrl;
	return System.fetch({
		address: fileUrl,
		name: fileUrl,
		metadata: {}
	}).then(function(source){
		context.paths[fileUrl || pkg.origFileUrl] = pkg;
		pkg.fileUrl = fileUrl;
		return source;
	},function(ex){
		return npmTraverseUp(context, pkg, fileUrl);
	});
};


function npmTraverseUp(context, pkg, fileUrl) {
	// make sure we aren't loading something we've already loaded
	var parentAddress = parentNodeModuleAddress(fileUrl);
	if(!parentAddress) {
		throw new Error('Did not find ' + pkg.origFileUrl);
	}
	var nodeModuleAddress = parentAddress+"/"+pkg.name+"/package.json";
	if(context.paths[nodeModuleAddress]) {
		// already processed
		return;
	} else {
		return npmLoad(context, pkg, nodeModuleAddress);
	}
	
}

var translateConfig = function(loader, packages){
	if(!loader.npm) {
		loader.npm = {};
		loader.npmPaths = {};
	}
	loader.npmPaths.__default = packages[0];
	
	packages.forEach(function(pkg){
		if(pkg.system) {
			loader.config(pkg.system);
		}
		if(!loader.npm[pkg.name]) {
			loader.npm[pkg.name] = pkg;
		}
		loader.npm[pkg.name+"@"+pkg.version] = pkg;
		var pkgAddress = pkg.fileUrl.replace(/\/package\.json.*/,"");
		loader.npmPaths[pkgAddress] = pkg;
	});
	
};


