
var getDeps = function(loader, bower){
	var deps = [];
	var addDeps = function(dependencies){
		for(var name in dependencies) {
			deps.push(name);
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
	var bower = JSON.parse(load.source);
	var bowerPath = loader.bowerPath || "bower_components";
	var deps = getDeps(loader, bower);
	
	var dep;
	for(var i = 0, len = deps.length; i < len; i++) {
		dep = deps[i];
		deps[i] = bowerPath + "/" + dep + "/bower.json";
	}
	deps.unshift("@loader");

	return "define(" + JSON.stringify(deps) + ", function(loader){\n" +
		"});";
};
