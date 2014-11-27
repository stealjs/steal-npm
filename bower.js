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

var denormalize = function(name){
	var len = name.length;
	if(name.substr(len - 3) === ".js") {
		return name.substr(0, len - 3);
	}
	return name;
}

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
	var config = bower.system || {};
	config.map = config.map || {};
	config.paths = config.paths || {};

	var mainDir = bowerPath + "/" + name + "/";
	var main = bower.main && ((typeof bower.main === "string")
															? bower.main : bower.main[0]);
	if(!config.paths[name] && main) {
		mainDir = bowerPath + "/" + name + "/" + joinURIs(main, ".");
	}
	config.paths[name + "/*"] = mainDir + "*.js";
	if(!config.map[name] && main) {
		var mainFile = main.split('/');
		mainFile = mainFile[mainFile.length - 1];
		config.map[name] = name + "/" + denormalize(mainFile);
	}

	return "define(" + JSON.stringify(amdDeps) + ", function(loader){\n" +
		"loader.config(" +JSON.stringify(config, null, " ") + ");" + "\n});";
};
