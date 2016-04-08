var utils = require("../npm-utils");

QUnit.module("npm-utils");

test("utils.moduleName.isConditional works", function() {
	var isConditional = utils.moduleName.isConditional;

	notOk(isConditional("foo@0.0.1#foo"), "not a valid condition");
	ok(isConditional("foo/#{bar}"), "should detect simple interpolation");
	ok(isConditional("foo/#{bar.baz}"), "should detect member expressions");
	ok(isConditional("foo#?bar.isBaz"), "should detect boolean conditions");
});

test("utils.moduleName.isNpm works", function() {
	var isNpm = utils.moduleName.isNpm;

	ok(isNpm("foo@0.0.1#foo"), "should detect valid npm package names");
	notOk(isNpm("foo/#{bar}"), "not a valid npm package module name");
	notOk(isNpm("foo/#{bar.baz}"), "not a valid npm package module name");
	notOk(isNpm("foo#?bar.isBaz"), "not a valid npm package module name");
});
