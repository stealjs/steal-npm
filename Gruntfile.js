
module.exports = function(grunt){

	grunt.initConfig({
		testee: {
			all: [
				"test/systemjs.html",
				"test/steal.html"
			]
		}
	});

	grunt.loadNpmTasks("testee");

	grunt.registerTask("test", ["testee:all"]);
};
