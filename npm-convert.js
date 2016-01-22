"format cjs";

var crawl = require('./npm-crawl');
var utils = require("./npm-utils");

exports.system = convertSystem;
exports.propertyNames = convertPropertyNames;
exports.propertyNamesAndValues = convertPropertyNamesAndValues;
exports.name = convertName;
exports.browser = convertBrowser;
exports.browserProperty = convertBrowserProperty;
exports.includeInBuild = false;

// Translate helpers ===============
// Given all the package.json data, these helpers help convert it to a source.
function convertSystem(context, pkg, system, root) {
	if(!system) {
		return system;
	}
	if(system.meta) {
		system.meta = convertPropertyNames(context, pkg, system.meta, root);
	}
	if(system.map) {
		system.map = convertPropertyNamesAndValues(context, pkg, system.map, root);
	}
	if(system.paths) {
		system.paths = convertPropertyNames(context, pkg, system.paths, root);
	}
	// needed for builds
	if(system.buildConfig) {
		system.buildConfig = convertSystem(context, pkg, system.buildConfig, root);
	}
	return system;
}

// converts only the property name
function convertPropertyNames (context, pkg, map , root) {
	if(!map) {
		return map;
	}
	var clone = {};
	for(var property in map ) {
		clone[convertName(context, pkg, map, root, property)] = map[property];
		// do root paths b/c we don't know if they are going to be included with the package name or not.
		if(root) {
			clone[convertName(context, pkg, map, false, property)] = map[property];
		}
	}
	return clone;
}

// converts both property name and value
function convertPropertyNamesAndValues (context, pkg, map , root) {
	if(!map) {
		return map;
	}
	var clone = {}, val;
	for(var property in map ) {
		val = map[property];
		clone[convertName(context, pkg, map, root, property)] = typeof val === "object"
			? convertPropertyNamesAndValues(context, pkg, val, root)
			: convertName(context, pkg, map, root, val);
	}
	return clone;
}

function convertName (context, pkg, map, root, name) {
	var parsed = utils.moduleName.parse(name, pkg.name),
		depPkg, requestedVersion;
	if( name.indexOf("#") >= 0 ) {

		if(parsed.packageName === pkg.name) {
			parsed.version = pkg.version;
		} else {
			// Get the requested version's actual version.
			requestedVersion = crawl.getDependencyMap(context.loader, pkg, root)[parsed.packageName].version;
			depPkg = crawl.matchedVersion(context, parsed.packageName, requestedVersion);
			parsed.version = depPkg.version;
		}
		return utils.moduleName.create(parsed);

	} else {
		if(root && name.substr(0,2) === "./" ) {
			return name.substr(2);
		} else {
			// this is for a module within the package
			if (name.substr(0,2) === "./" ) {
				return utils.moduleName.create({
					packageName: pkg.name,
					modulePath: name,
					version: pkg.version,
					plugin: parsed.plugin
				});
			} else {
				// TODO: share code better!
				// SYSTEM.NAME
				if(  pkg.name === parsed.packageName || ( (pkg.system && pkg.system.name) === parsed.packageName) ) {
					depPkg = pkg;
				} else {
					var requestedProject = crawl.getDependencyMap(context.loader, pkg, root)[parsed.packageName];
					if(!requestedProject) {
						if(root) warn(name);
						return name;
					}
					requestedVersion = requestedProject.version;
					depPkg = crawl.matchedVersion(context, parsed.packageName, requestedVersion);
					// If we still didn't find one just use the first available version.
					if(!depPkg) {
						var versions = context.versions[parsed.packageName];
						depPkg = versions && versions[requestedVersion];
					}
				}
				// SYSTEM.NAME
				if(depPkg.system && depPkg.system.name) {
					parsed.packageName = depPkg.system.name;
				}

				parsed.version = depPkg.version;
				if(!parsed.modulePath) {
					parsed.modulePath = utils.pkg.main(depPkg);
				}
				return utils.moduleName.create(parsed);
			}

		}

	}
}


/**
 * Converts browser names into actual module names.
 *
 * Example:
 *
 * ```
 * {
 * 	 "foo": "browser-foo"
 *   "traceur#src/node/traceur": "./browser/traceur"
 *   "./foo" : "./foo-browser"
 * }
 * ```
 *
 * converted to:
 *
 * ```
 * {
 * 	 // any foo ... regardless of where
 *   "foo": "browser-foo"
 *   // this module ... ideally minus version
 *   "traceur#src/node/traceur": "transpile#./browser/traceur"
 *   "transpile#./foo" : "transpile#./foo-browser"
 * }
 * ```
 */
function convertBrowser(pkg, browser) {
	if(typeof browser === "string") {
		return browser;
	}
	var map = {};
	for(var fromName in browser) {
		convertBrowserProperty(map, pkg, fromName, browser[fromName]);
	}
	return map;
}


function convertBrowserProperty(map, pkg, fromName, toName) {
	var packageName = pkg.name;

	var fromParsed = utils.moduleName.parse(fromName, packageName),
		  toParsed = toName  ? utils.moduleName.parse(toName, packageName): "@empty";

	map[utils.moduleName.create(fromParsed)] = utils.moduleName.create(toParsed);
}

var warn = (function(){
	var warned = {};
	return function(name){
		if(!warned[name]) {
			warned[name] = true;
			var warning = "WARN: Could not find " + name + " in node_modules. Ignoring.";
			if(typeof steal !== "undefined" && steal.dev && steal.dev.warn) steal.dev.warn(warning)
			else if(console.warn) console.warn(warning);
			else console.log(warning);
		}
	};
})();
