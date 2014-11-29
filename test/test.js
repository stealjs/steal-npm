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
