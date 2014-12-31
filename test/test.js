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
	GlobalSystem.import("jquery").then(function($){
		ok($.fn.jquery, "jQuery loaded");
	}).then(start);
});

asyncTest("meta", function(){

	GlobalSystem.import("test/meta").then(function(meta){
		equal(meta,"123", "got 123");
	}).then(start);
});

asyncTest("module names that start with @", function(){
	GlobalSystem.paths["@foo"] = "test/foo.js";
	GlobalSystem.import("@foo").then(function(foo){
		equal(foo,"bar", "got 123");
	}).then(start);
});

asyncTest("jquery-ui", function(){
	GlobalSystem.paths["@foo"] = "test/foo.js";
	Promise.all([
		GlobalSystem.import("jquery"),
		GlobalSystem.import("jquery-ui/draggable")
	]).then(function(mods){
		var $ = mods[0];
		ok($.fn.draggable);
	}).then(start);

});

// Only run these tests for StealJS (because it requires steal syntax)
if(window.steal) {
	asyncTest("canjs", function(){
		GlobalSystem.import("can/control/control").then(function(Control){
			ok(Control.extend, "Control has an extend method");
		}).then(start);
	});
}

QUnit.start();
