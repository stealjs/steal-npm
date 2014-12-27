QUnit.module("system-npm plugin");
var GlobalSystem = window.System;

asyncTest("transpile works", function(){
	Promise.all([
		System.import("transpile"),
		System.import("jquery")
	]).then(function(res){
		var transpile = res[0],
			$ = res[1];
			
		equal(typeof transpile, "object", "object returned");
		equal(typeof $, "function", "function returned");
		
		return new Promise(function(resolve, reject){

				$.ajax("../node_modules/transpile/test/tests/es6.js",{dataType: "text"}).then(function(data){
					var res = transpile.to({
						source: ""+data, 
						address: "../node_modules/transpile/test/tests/es6.js", 
						name: "tests/es6", 
						metadata: {format: "es6"}
					}, "cjs");
					
					return $.ajax("../node_modules/transpile/test/tests/expected/es6_cjs.js",{dataType: "text"})
						.then(function(answer){
							QUnit.equal(answer, res);
					});
					
				}, reject).then(resolve, reject);
		});
		
	}).then(start);
});


asyncTest("Loads globals", function(){
	GlobalSystem.import("jquery").then(function(){
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
