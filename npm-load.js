"format cjs";

var convert = require("./npm-convert");
var utils = require("./npm-utils");

exports.saveLoad = function(context){
	var loader = context.loader;
	if(loader.getModuleLoad) {
		var load = loader.getModuleLoad("package.json!npm");
		var source = exports.makeSource(context);
		load.source = source;
	}
};

exports.makeSource = function(context, pkg){
	pkg = pkg || context.loader.npmPaths.__default;
	var configDependencies = ["@loader","npm-extension","module"].concat(
		exports.configDeps(context, pkg)
	);
	var pkgMain = exports.pkgMain(context, pkg);
	var options = exports.options(context);

	return "def" + "ine(" + JSON.stringify(configDependencies) +
		", function(loader, npmExtension, module){\n" +
		"npmExtension.addExtension(loader);\n"+
		(pkg.main ? "if(!loader.main){ loader.main = " + 
		 JSON.stringify(pkgMain) + "; }\n" : "") +
		"loader._npmExtensions = [].slice.call(arguments, 2);\n" +
		"("+ translateConfig.toString() + ")(loader, " + 
		JSON.stringify(context.pkgInfo, null, " ") + ", " +
		JSON.stringify(options, null, " ") + ");\n" +
	"});";
};

exports.saveLoadIfNeeded = function(context){
	// Only do the actual saving in the build
	var loader = context.loader;
	if(true || loader.isEnv && loader.isEnv("build")) {
		exports.saveLoad(context);
	}
};

exports.configDeps = function(context, pkg){
	var deps = [];
	if(pkg.system && pkg.system.configDependencies) {
		deps = deps.concat(pkg.system.configDependencies);
	}
	if(context.loader.configDependencies) {
		deps = deps.concat(context.loader.configDependencies);
	}
	return deps;
};

exports.pkgMain = function(context, pkg){
	var pkgMain = utils.pkg.main(pkg);
	// Convert the main if using directories.lib
	if(utils.pkg.hasDirectoriesLib(pkg)) {
		var mainHasPkg = pkgMain.indexOf(pkg.name) === 0;
		if(mainHasPkg) {
			pkgMain = convert.name(context, pkg, false, true, pkgMain);
		} else {
			pkgMain = convert.name(context, pkg, false, true, pkg.name+"/"+pkgMain);
		}
	}
	return pkgMain;
};

// grab bag of options needed in prod
exports.options = function(context){
	return {
		npmParentMap: context.loader.npmParentMap
	};
};

var translateConfig = function(loader, packages, options){
	var g = loader.global;
	if(!g.process) {
		g.process = {
			cwd: function(){},
			browser: true,
			env: {
				NODE_ENV: loader.env
			}
		};
	}

	if(!loader.npm) {
		loader.npm = {};
		loader.npmPaths = {};
		loader.globalBrowser = {};
		loader.npmParentMap = options.npmParentMap || {};
	}
	loader.npmPaths.__default = packages[0];
	var lib = packages[0].system && packages[0].system.directories && packages[0].system.directories.lib;


	var setGlobalBrowser = function(globals, pkg){
		for(var name in globals) {
			loader.globalBrowser[name] = {
				pkg: pkg,
				moduleName: globals[name]
			};
		}
	};
	var setInNpm = function(name, pkg){
		if(!loader.npm[name]) {
			loader.npm[name] = pkg;
		}
		loader.npm[name+"@"+pkg.version] = pkg;
	};
	var forEach = function(arr, fn){
		var i = 0, len = arr.length;
		for(; i < len; i++) {
			fn.call(arr, arr[i]);
		}
	};
	var setupLiveReload = function(){
		var hasLiveReload = !!(loader.liveReloadInstalled || loader._liveMap);
		if(hasLiveReload) {
			loader["import"]("live-reload", { name: module.id }).then(function(reload){
				reload.dispose(function(){
					// Remove state created by the config.
					delete loader.npm;
					delete loader.npmPaths;
				});
			});
		}
	};
	forEach(packages, function(pkg){
		if(pkg.system) {
			// don't set system.main
			var main = pkg.system.main;
			delete pkg.system.main;
			delete pkg.system.configDependencies;
			loader.config(pkg.system);
			pkg.system.main = main;

		}
		if(pkg.globalBrowser) {
			setGlobalBrowser(pkg.globalBrowser, pkg);
		}
		var systemName = pkg.system && pkg.system.name;
		if(systemName) {
			setInNpm(systemName, pkg);
		} else {
			setInNpm(pkg.name, pkg);
		}
		if(!loader.npm[pkg.name]) {
			loader.npm[pkg.name] = pkg;
		}
		loader.npm[pkg.name+"@"+pkg.version] = pkg;
		var pkgAddress = pkg.fileUrl.replace(/\/package\.json.*/,"");
		loader.npmPaths[pkgAddress] = pkg;
	});
	forEach(loader._npmExtensions || [], function(ext){
		// If there is a systemConfig use that as configuration
		if(ext.systemConfig) {
			loader.config(ext.systemConfig);
		}
	});
	setupLiveReload();
};

exports.includeInBuild = false;
