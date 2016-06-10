var helpers = require("./helpers")(System);
var utils = require("npm-utils");
var forEach = utils.forEach;

QUnit.module("Translating npm modules");

QUnit.test("Adds Buffer global when used", function(assert){
	var done = assert.async();

	var tests = [
		{
			source: "var Buffer = 'foo';",
			included: false
		},
		{
			source: "let Buffer = 'foo';",
			included: false
		},
		{
			source: "const Buffer = 'foo';",
			included: false
		},
		{
			source: "var foo = new Buffer()",
			included: true
		},
		{
			source: "var none = 'any buffer at all';",
			included: false
		}
	];

	var loader = helpers.clone().loader;

	var promises = utils.map(tests, function(test){
		return loader.translate({
			name: 'some-id',
			address: 'foo://bar',
			metadata: {},
			source: test.source
		}).then(function(src){
			var included = /require/.test(src);
			assert.equal(included, test.included,
						 "Buffer was added (or not added)");
		});
	});

	Promise.all(promises)
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Doesn't add buffer when loader.insertNodeGlobals is false", function(assert){
	var done = assert.async();
	var loader = helpers.clone()
		.withConfig({
			insertNodeGlobals: false
		})
		.loader;

	loader.translate({
		name: "some-id",
		address: "foo://bar",
		source: "var foo = new Buffer();",
		metadata: {}
	})
	.then(function(src){
		var included = /require/.test(src);
		assert.ok(!included, "shim wasn't added as a dependency");
	})
	.then(done, helpers.fail(assert, done));
});

QUnit.test("Doesn't add buffer when insertNodeGlobals meta is false", function(assert){
	var done = assert.async();
	var loader = helpers.clone().loader;

	loader.translate({
		name: "some-id",
		address: "foo://bar",
		source: "var foo = new Buffer();",
		metadata: {
			insertNodeGlobals: false
		}
	})
	.then(function(src){
		var included = /require/.test(src);
		assert.ok(!included, "shim wasn't added as a dependency");
	})
	.then(done, helpers.fail(assert, done));
});
