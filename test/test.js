QUnit.module("system-bower plugin");

asyncTest("Basics works", function(){
	System.import("lodash").then(function(_){
		equal(typeof _, "function", "Function returned");
	}).then(start);
});

asyncTest("Loads globals", function(){
	System.import("jquery").then(function(){
		ok($.fn.jquery, "jQuery loaded");
	}).then(start);
});

/*asyncTest("Loads buildConfig", function(){
	System.import("test/build_config/bower.json!bower").then(function(){
		var config = System.buildConfig;
		ok(config, "buildConfig added");
		equal(config.map.foo, "bar", "Correct map included");
	}).then(start);
});

asyncTest("Replaces bower_components path in paths", function(){
	System.bowerPath = "vendor";
	System.import("test/alt_path/bower.json!bower").then(function(){
		equal(System.paths.bar, "vendor/bar/bar.js", "Correct path set");
	}).then(start);
});*/

// Only run these tests for StealJS (because it requires steal syntax)
if(System.isSteal) {
	asyncTest("Modules with their own config works", function(){
		System.import("can").then(function(can){
			var $ = can.$;
			var tmpl = can.mustache("Hello {{name}}");
			$("#qunit-test-area").html(tmpl({
				name: "World"
			}));

			equal($("#qunit-test-area").html(), "Hello World", "Loaded can and rendered a template");
		}).then(start);
	});
}

QUnit.start();
