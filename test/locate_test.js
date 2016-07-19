var helpers = require("./helpers")(System);

QUnit.module("locating");

QUnit.test("directories.lib: '.' works", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			system: {
				directories: {
					lib: "."
				}
			}
		})
		.withConfig({
			baseURL: "/foo/bar"
		})
		.loader;

	helpers.init(loader)
	.then(function(){
		return loader.locate({ name: "app@1.0.0#main", metadata: {} });
	})
	.then(function(address){
		console.log(address);
		assert.ok(/foo\/bar\//.test(address), "inside the baseURL");
	})
	.then(done, helpers.fail(assert, done));
});
