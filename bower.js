"format cjs";

// Add @loader, for SystemJS
if(!System.has("@loader")) {
	System.set('@loader', System.newModule({'default':System, __useDefault: true}));
}

var excludedDeps = {
	steal: true,
	systemjs: true,
	"system-bower": true
};

var inited = false;
// Combines together dependencies and devDependencies (if bowerDev option is enabled)
var getDeps = function(loader, bower){
	var deps = {};
	var addDeps = function(dependencies){
		for(var name in dependencies) {
			if(!excludedDeps[name]) {
				deps[name] = dependencies[name];
			}
		}
	};
	addDeps(bower.dependencies || {});
	// Only get the devDependencies if this is the root bower and the 
	// `bowerDev` option is enabled
	if(loader.bowerDev && !inited) {
		addDeps(bower.devDependencies || {});
	}
	inited = true;
	return deps;
};

// Get the directory where the main is located, including the bowerPath
var getMainDir = function(bowerPath, name, main){
	var parts = main.split('/');
	parts.pop();

	// Remove . if it starts with that
	if(parts[0] === '.') {
		parts.shift();
	}
	parts.unshift.apply(parts, [bowerPath, name]);
	return parts.join('/');
};

// Set paths for this dependency
var setPaths = function(config, bowerPath, name, main) {
	var mainDir = bowerPath + "/" + name + "/";
	if(!config.paths[name] && main) {
		var mainDir = getMainDir(bowerPath, name, main);
	}
	config.paths[name] = [bowerPath, name, main].join('/');
	config.paths[name + "/*"] = mainDir + "/*.js";
};

exports.translate = function(load){
	var loader = this;
	var bowerPath = loader.bowerPath || "bower_components";

	// Get bower dependencies
	var bower = JSON.parse(load.source);
	var deps = getDeps(loader, bower);
	
	var amdDeps = [];
	for(var dep in deps) {
		amdDeps.push(
			bowerPath + "/" + dep + "/bower.json!bower"
		);
	}
	amdDeps.unshift("@loader");

	// Create configuration
	var name = bower.name.toLowerCase();
	var config = bower.system || {};
	config.map = config.map || {};
	config.paths = config.paths || {};

	var main = bower.main && ((typeof bower.main === "string")
								? bower.main : bower.main[0]);
	setPaths(config, bowerPath, name, main);

	return "define(" + JSON.stringify(amdDeps) + ", function(loader){\n" +
		"loader.config(" +JSON.stringify(config, null, " ") + ");" + "\n});";
};
