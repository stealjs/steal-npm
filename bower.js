var joinURIs = require("./joinuris");

var excludedDeps = {
	steal: true,
	systemjs: true,
	"system-bower": true
};

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
	if(loader.bowerDev) {
		addDeps(bower.devDependencies || {});
	}
	return deps;
};

exports.translate = function(load){
	var loader = this;
	var bowerPath = loader.bowerPath || "bower_components";
	loader.map["bower"] = bowerPath + "/system-bower/bower";

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
	var config = bower.system || {
		paths: {}
	};
	var mainDir = bowerPath + "/" + name + "/";
	if(!config.paths[name]) {
		var main = bower.main && ((typeof bower.main === "string")
															? bower.main : bower.main[0]);
		mainDir = bowerPath + "/" + name + "/" + joinURIs(main, ".");
	}
	config.paths[name + "/*"] = mainDir + "*.js";

	return "define(" + JSON.stringify(amdDeps) + ", function(loader){\n" +
		"loader.config(" +JSON.stringify(config, null, " ") + ");" + "\n});";
};
