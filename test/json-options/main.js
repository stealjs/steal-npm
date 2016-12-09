var loader = require('@loader');
var dep1 = require('dep1');

if(window.QUnit) {
	var json = require('foo.json');

	QUnit.equal(json.foo, "bar", "foo.json foo property not was not deleted");

	var appPackage = loader.npmContext.pkgInfo[0];
	QUnit.ok(!appPackage.foo, "foo property was deleted in apps package.json");

	var dep1Package = loader.npmContext.pkgInfo[1];
	QUnit.ok(!dep1Package._npmVersion, "_npmVersion property was deleted in dep1s package.json");

	removeMyself();
} else {
	console.log(loader.npmContext.pkgInfo);
}
