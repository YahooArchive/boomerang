/* eslint-env node */

"use strict";
module.exports = function (grunt) {

    var src = [ "boomerang.js" ];
    var plugins = grunt.file.readJSON("plugins.json");
    src.push(plugins.plugins);
    src.push("plugins/zzz_last_plugin.js");

    grunt.initConfig({
	pkg:  grunt.file.readJSON("package.json"),
	concat: {
	    options: {
		stripBanners: {
		    block : true,
		    line: true
		},
		seperator: ";"
	    },
	    debug: {
		src: src,
		dest: "build/<%= pkg.name %>-<%= pkg.version %>-debug.js"
	    },
	    release: {
		src: src,
		dest: "build/<%= pkg.name %>-<%= pkg.version %>.js"
	    }
	},
	eslint: {
	    target: [
		"Gruntfile.js",
		"boomerang.js",
		"plugins/*.js"
	    ]
	},
	"string-replace": {
	    release: {
		files: [{
		    src: "build/<%= pkg.name %>-<%= pkg.version %>.js",
		    dest: "build/<%= pkg.name %>-<%= pkg.version %>.js"
		}],
		options: {
		    replacements: [{
			pattern: /else{}/g,
			replacement: ""
		    },{
			pattern: /\(window\)\);/g,
			replacement: "\(window\)\);\n"
		    },{
			pattern: /\(\)\);\(function\(/g,
			replacement: "\(\)\);\n(function("
		    }]
		}
	    }
	},
	uglify: {
	    options : {
		preserveComments: false,
		mangle: false,
		sourceMap: true
	    },
	    min_release: {
		report: "gzip",
		src: "build/<%= pkg.name %>-<%= pkg.version %>.js",
		dest: "build/<%= pkg.name %>-<%= pkg.version %>.min.js"
	    },
	    min_debug: {
		report: "gzip",
		src: "build/<%= pkg.name %>-<%= pkg.version %>-debug.js",
		dest: "build/<%= pkg.name %>-<%= pkg.version %>-debug.min.js"
	    }
	},
	clean: {
	    options: {},
	    build: ["build/"],
	    src: ["plugins/*~","*.js~"]
	},
	karma: {
	    options: {
		configFile: "./karma.config.js",
		preprocessors: {
		    "./build/*.js": ["coverage"],
		},
		basePath: "./",
		files: [
		    "tests/vendor/mocha/mocha.css",
		    "tests/vendor/mocha/mocha.js",
		    "tests/vendor/chai/chai.js",
		    "tests/library/*.js",
		    "./build/<%= pkg.name %>-<%= pkg.version %>.js"
		]
	    },
	    unit: { 
		singleRun: true,
		colors: false,
		browsers: ['PhantomJS']		
	    },
	    dev: { 
		singleRun: false,
		colors: false,
		browsers: ['Chrome']
	    }
	}
    });

    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-string-replace");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-clean");

    grunt.registerTask("default",["clean","concat","string-replace","uglify"]);
    grunt.registerTask("test",["default","karma"]);
};
