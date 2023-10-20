/* eslint-env node */
"use strict";

//
// Imports
//
var fs = require("fs");
var path = require("path");
var fse = require("fs-extra");
var stripJsonComments = require("strip-json-comments");
var grunt = require("grunt");
var async = require("async");

//
// Constants
//

//
// Domains for test purposes
//
var DEFAULT_TEST_MAIN_DOMAIN = "boomerang-test.local";
var DEFAULT_TEST_SECONDARY_DOMAIN = "boomerang-test2.local";

var boomerangE2ETestDomain = grunt.option("main-domain") || DEFAULT_TEST_MAIN_DOMAIN;
var boomerangE2ESecondDomain = grunt.option("secondary-domain") || DEFAULT_TEST_SECONDARY_DOMAIN;

var BUILD_PATH = "build";
var TEST_BUILD_PATH = path.join("tests", "build");
var TEST_RESULTS_PATH = path.join("tests", "results");
var TEST_DEBUG_PORT = parseInt(grunt.option("test-port")) || 4002;
var TEST_SCHEME = grunt.option("test-scheme") || "http";
var TEST_URL_BASE = grunt.option("test-url") || TEST_SCHEME + "://" + boomerangE2ETestDomain + ":" + TEST_DEBUG_PORT;

var SELENIUM_ADDRESS = grunt.option("selenium-address") || "http://" + boomerangE2ETestDomain + ":4444/wd/hub";
var E2E_BASE_URL = TEST_SCHEME + "://" + boomerangE2ETestDomain + ":" + TEST_DEBUG_PORT + "/";

var DEFAULT_BROWSER = grunt.option("test-browser") || "ChromeHeadless";

var DEFAULT_UGLIFY_BOOMERANGJS_OPTIONS = {
  preserveComments: false,
  mangle: {
    // for errors.js
    reserved: [
      "createStackForSend",
      "loadFinished",
      "BOOMR_addError",
      "BOOMR_plugins_errors_onerror",
      "BOOMR_plugins_errors_onxhrerror",
      "BOOMR_plugins_errors_console_error",
      "BOOMR_plugins_errors_wrap",
      "BOOMR_plugins_errors_wrapped_function",
      "BOOMR_plugins_errors_wrapped_removeEventListener"
    ]
  },
  ie8: true,
  sourceMap: true,
  compress: {
    keep_fnames: true,
    sequences: false
  }
};

var SAUCELABS_CONFIG = {
  username: process.env.CI_SAUCELABS_USERNAME,
  key: function() {
    return process.env.CI_SAUCELABS_KEY;
  },
  build: process.env.CI_BUILD_NUMBER,
  tunneled: false
};

var LINT_TARGETS = [
  "*.js",
  "plugins/*.js",
  "snippets/*.js",
  "tasks/*.js",
  "tests/*.js",
  "tests/unit/*.js",
  "tests/unit/*.html",
  "tests/e2e/*.js",
  "tests/server/*.js",
  "tests/page-templates/**/*.js",
  "tests/page-templates/**/*.html",
  "tests/page-templates/**/*.js",
  "tests/test-templates/**/*.js",
  "!tests/page-templates/12-react/support/*",
  // fails on snippet include
  "!tests/page-templates/03-load-order/01-after-page-load.html",
  // fails on snippet include
  "!tests/page-templates/03-load-order/07-after-page-load-boomr-page-ready.html",
  // parse error on snippet include
  "!tests/page-templates/29-opt-out-opt-in/01-opt-in-origin-injected-loader-wrapper.html"
];

// Get WebDriver versions, allowing for a single argument or an array
var webDriverVersions = grunt.option("webdriver-versions");

if (Array.isArray(webDriverVersions)) {
  webDriverVersions = webDriverVersions.join(" ");
}

function fileForHtml(file) {
  return grunt.file.read(file)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Gets the build configuration
 */
function getBuildConfig() {
  var buildConfig = {
    server: grunt.option("server") || DEFAULT_TEST_MAIN_DOMAIN || "localhost",
    beaconUrlsAllowed: grunt.option("beacon-urls-allowed") || ""
  };

  return buildConfig;
}

//
// Grunt config
//
function getConfig() {
  //
  // Paths
  //
  var testsDir = path.join(__dirname, "tests");
  var perfTestsDir = path.join(testsDir, "perf");
  var pageTemplateSnippetsDir = path.join(testsDir, "page-template-snippets");
  var pluginsDir = path.join(__dirname, "plugins");
  var snippetsDir = path.join(__dirname, "snippets");

  //
  // Build numbers
  //
  var pkg = grunt.file.readJSON("package.json");
  var buildNumber = grunt.option("build-number") || 0;
  var releaseVersion = pkg.releaseVersion + "." + buildNumber;
  var buildRevision = grunt.option("build-revision") || 0;
  var buildSuffix = grunt.option("build-suffix") ? (grunt.option("build-suffix") + ".") : "";
  var buildFlavor = grunt.option("build-flavor") || "";

  if (buildFlavor) {
    buildSuffix = buildFlavor + "." + buildSuffix;
  }

  //
  // Determine source files:
  //  boomerang.js and plugins/*.js order
  //
  var src = ["boomerang.js"];

  // default plugins
  var plugins = grunt.file.readJSON("plugins.json");

  // allow overwriting with user plugins (plugins.user.json)
  try {
    var userPlugins = grunt.file.readJSON("plugins.user.json");

    if (userPlugins.plugins) {
      // use the user plugins instead
      grunt.log.ok("Using plugins.user.json");

      plugins = userPlugins;
    }
  }
  catch (e) {
    // NOP
  }

  // use a specific flavor
  if (buildFlavor) {
    if (!plugins.flavors[buildFlavor]) {
      return grunt.fail.fatal("Build flavor " + buildFlavor + " does not exist");
    }

    grunt.log.ok("Building flavor: " + buildFlavor + " with " + plugins.flavors[buildFlavor].plugins.length +
      " plugins: " + JSON.stringify(plugins.flavors[buildFlavor].plugins));

    src.push(plugins.flavors[buildFlavor].plugins);

    buildRevision = plugins.flavors[buildFlavor].revision;
  }
  else {
    src.push(plugins.plugins);
  }

  // always the last plugin
  src.push(path.join(pluginsDir, "zzz-last-plugin.js"));

  // calculate version string
  var boomerangVersion = releaseVersion + "." + buildRevision;

  //
  // Snippets
  //
  var autoXhrSnippet = path.join(snippetsDir, "autoxhr-snippet.js");
  var continuitySnippet = path.join(snippetsDir, "continuity-snippet.js");
  var errorsSnippet = path.join(snippetsDir, "errors-snippet.js");
  var loaderSnippet = path.join(snippetsDir, "loader-snippet.js");
  var loaderSnippetAfterOnload = path.join(snippetsDir, "loader-snippet-after-onload.js");

  //
  // Ensure env.json exists
  //
  var envFile = path.resolve(path.join(testsDir, "server", "env.json"));
  var env;

  if (!fs.existsSync(envFile)) {
    // use the sample file if it exists
    var sampleFile = path.resolve(path.join(testsDir, "server", "env.json.sample"));

    if (fs.existsSync(sampleFile)) {
      console.info("Creating env.json from defaults");
      fse.copySync(sampleFile, envFile);
    }
  }

  // load the env.json or default content
  if (fs.existsSync(envFile)) {
    env = grunt.file.readJSON(envFile);
  }
  else {
    // default content
    env = {
      publish: "www"
    };
  }

  //
  // Browser Unit Tests
  //
  var browserUnitTests = [];
  var browserUnitTestsFile = path.join(testsDir, "browsers-unit.json");

  if (fs.existsSync(browserUnitTestsFile)) {
    browserUnitTests = JSON.parse(stripJsonComments(grunt.file.read(browserUnitTestsFile)));
  }

  //
  // Build SauceLabs E2E test URLs
  //
  var e2eTests = [];

  if (grunt.file.exists("tests/e2e/e2e.json")) {
    var e2eData = JSON.parse(stripJsonComments(grunt.file.read("tests/e2e/e2e.json")));

    e2eTests = e2eData.tests || e2eData;
  }

  var e2eUrls = [];

  for (var i = 0; i < e2eTests.length; i++) {
    e2eUrls.push(TEST_URL_BASE + "pages/" + e2eTests[i].path + "/" + e2eTests[i].file + ".html");
  }

  //
  // Output files
  //

  // build file name is based on the version number
  var buildFilePrefix = "boomerang-" + boomerangVersion;
  var buildPathPrefix = path.join(BUILD_PATH, buildFilePrefix);

  var testBuildFilePrefix = "boomerang";
  var testBuildPathPrefix = path.join(TEST_BUILD_PATH, testBuildFilePrefix);

  var buildDebug = buildPathPrefix + "-debug." + buildSuffix + "js";
  var buildDebugGz = buildPathPrefix + "-debug." + buildSuffix + "js.gz";
  var buildDebugMin = buildPathPrefix + "-debug." + buildSuffix + "min.js";
  var buildDebugMinGz = buildPathPrefix + "-debug." + buildSuffix + "min.js.gz";
  var buildRelease = buildPathPrefix + "." + buildSuffix + "js";
  var buildReleaseGz = buildPathPrefix + "." + buildSuffix + "js.gz";
  var buildReleaseMin = buildPathPrefix + "." + buildSuffix + "min.js";
  var buildReleaseMinGz = buildPathPrefix + "." + buildSuffix + "min.js.gz";
  var buildTest = testBuildPathPrefix + "-latest-debug.js";
  var buildTestMin = testBuildPathPrefix + "-latest-debug.min.js";

  var buildPluginsDir = path.join(BUILD_PATH, "plugins");
  var buildSnippetsDir = path.join(BUILD_PATH, "snippets");
  var buildSnippetsStrippedDir = path.join(BUILD_PATH, "snippets.stripped");

  //
  // Build configuration
  //
  var buildConfig = getBuildConfig();

  var bannerFilePathRelative = "./lib/banner.txt";
  var bannerFilePathAbsolute = path.resolve(bannerFilePathRelative);
  var bannerString = grunt.file.read(bannerFilePathAbsolute);

  // Load perf test tasks
  if (fs.existsSync(perfTestsDir)) {
    // The perf tests use NodeJS 8+ features such as async/await and util.promisify
    var nodeVersionMajor = Number(process.version.match(/^v(\d+)\.\d+/)[1]);

    if (nodeVersionMajor >= 8) {
      grunt.registerTask(
        "perf-tests",
        "Tests Performance",
        require("./tests/perf/perf-tests"));

      grunt.registerTask(
        "perf-compare",
        "Compares current Performance to Baseline",
        require("./tests/perf/perf-compare"));
    }
    else {
      grunt.log.writeln("Warning: Node version " +
        process.version +
        " does not support async or util.promisify, used by perf tests.");

      grunt.log.writeln("Use NodeJS 8+ to run perf tests.");
    }
  }

  return {
    // package info
    pkg: pkg,

    //
    // Variables to use in tasks
    //
    buildConfig: buildConfig,
    boomerangVersion: boomerangVersion,
    buildFilePrefix: buildFilePrefix,
    buildPathPrefix: buildPathPrefix,
    testBuildPathPrefix: testBuildPathPrefix,
    buildSuffix: buildSuffix,

    //
    // Tasks
    //
    githash: {
      main: {
        options: {}
      }
    },
    concat: {
      options: {
        stripBanners: false,
        seperator: ";"
      },
      debug: {
        src: src,
        dest: buildDebug
      },
      "debug-tests": {
        src: [src, "tests/boomerang-test-plugin.js"],
        dest: buildTest
      },
      release: {
        src: src,
        dest: buildRelease
      },
      autoXhrSnippet: {
        src: autoXhrSnippet,
        dest: path.join(pageTemplateSnippetsDir, "instrumentXHRSnippetNoScript.tpl")
      },
      continuitySnippet: {
        src: continuitySnippet,
        dest: path.join(pageTemplateSnippetsDir, "continuitySnippetNoScript.tpl")
      },
      errorsSnippet: {
        src: errorsSnippet,
        dest: path.join(pageTemplateSnippetsDir, "captureErrorsSnippetNoScript.tpl")
      },
      loaderSnippet: {
        src: loaderSnippet,
        dest: path.join(pageTemplateSnippetsDir, "boomerangSnippetNoScript.tpl")
      },
      loaderSnippetAfterOnload: {
        src: loaderSnippetAfterOnload,
        dest: path.join(pageTemplateSnippetsDir, "boomerangAfterOnloadSnippetNoScript.tpl")
      }
    },
    mkdir: {
      test: {
        options: {
          mode: "0777",
          create: [TEST_RESULTS_PATH]
        }
      },
      build: {
        options: {
          mode: "0777",
          create: [BUILD_PATH]
        }
      }
    },
    eslint: {
      target: LINT_TARGETS,
      fix: {
        options: {
          fix: true
        },
        src: LINT_TARGETS
      }
    },
    "string-replace": {
      all: {
        files: [
          {
            src: buildRelease,
            dest: buildRelease
          },
          {
            src: buildDebug,
            dest: buildDebug
          },
          {
            src: buildTest,
            dest: buildTest
          }
        ],
        options: {
          replacements: [
            {
              // Replace 1.0 with 1.[0 or jenkins build #].[date]
              pattern: "%boomerang_version%",
              replacement: boomerangVersion
            },
            {
              // strip out BOOMR = window.BOOMR || {}; in plugins
              pattern: /BOOMR\s*=\s*window\.BOOMR\s*\|\|\s*{};/g,
              replacement: ""
            },
            {
              // strip out BOOMR.plugins = BOOMR.plugins || {}; in plugins
              pattern: /BOOMR\.plugins\s*=\s*BOOMR\.plugins\s*\|\|\s*{};/g,
              replacement: ""
            },
            {
              pattern: /beacon_urls_allowed: \[\]/,
              replacement: "beacon_urls_allowed: [" + buildConfig.beaconUrlsAllowed + "]"
            }
          ]
        }
      },
      "debug-tests": {
        files: [{
          src: buildTest,
          dest: buildTest
        }],
        options: {
          replacements: [
            {
              // Send beacons to null
              pattern: /beacon_url: .*/,
              replacement: "beacon_url: \"/beacon\","
            }
          ]
        }
      },
      release: {
        files: [{
          src: buildRelease,
          dest: buildRelease
        }],
        options: {
          // strip out some NOPs
          replacements: [
            {
              pattern: /else{}/g,
              replacement: ""
            },
            {
              pattern: /\(window\)\);/g,
              replacement: "\(window\)\);\n"
            },
            {
              pattern: /\(\)\);\(function\(/g,
              replacement: "\(\)\);\n(function("
            }
          ]
        }
      },
      "doc-source-code": {
        files: [
          {
            "./": "build/doc/boomerangjs/**/*.html"
          }
        ],
        options: {
          replacements: [
            {
              pattern: /%minified_consent_inline_plugin_code%/g,
              replacement: fileForHtml.bind(this, "build/plugins/consent-inlined-plugin.min.js")
            },
            {
              pattern: /%loader_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets.stripped/loader-snippet.js")
            },
            {
              pattern: /%minified_loader_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets/loader-snippet.min.js")
            },
            {
              pattern: /%delayed_loader_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets.stripped/loader-snippet-after-onload.js")
            },
            {
              pattern: /%minified_delayed_loader_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets/loader-snippet-after-onload.min.js")
            },
            {
              pattern: /\/\* eslint-.*\*\/\n/g,
              replacement: ""
            },
            {
              pattern: /%autoxhr_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets.stripped/autoxhr-snippet.js")
            },
            {
              pattern: /%minified_autoxhr_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets/autoxhr-snippet.min.js")
            },
            {
              pattern: /%continuity_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets.stripped/continuity-snippet.js")
            },
            {
              pattern: /%minified_continuity_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets/continuity-snippet.min.js")
            },
            {
              pattern: /%errors_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets.stripped/errors-snippet.js")
            },
            {
              pattern: /%minified_errors_snippet%/g,
              replacement: fileForHtml.bind(this, "build/snippets/errors-snippet.min.js")
            }
          ]
        }
      },
      readme: {
        files: [
          {
            src: "doc/README.template.md",
            dest: "README.md"
          }
        ],
        options: {
          replacements: [
            {
              pattern: /%loader_snippet%/g,
              // not escaping for HTML in a Markdown file
              replacement: grunt.file.read.bind(this, "snippets/loader-snippet.js")
            },
            {
              pattern: /%minified_loader_snippet%/g,
              // not escaping for HTML in a Markdown file
              replacement: grunt.file.read.bind(this, "build/snippets/loader-snippet.min.js")
            }
          ]
        }
      },
      "plugins-remove-sourcemappingurl": {
        files: [
          {
            "./": path.join(buildPluginsDir, "*.min.js")
          }
        ],
        options: {
          replacements: [
            {
              pattern: /\n\/\/# sourceMappingURL=.*/g,
              replacement: ""
            }
          ]
        }
      },
      "remove-sourcemappingurl": {
        files: [
          {
            src: buildReleaseMin,
            dest: buildReleaseMin
          }
        ],
        options: {
          replacements: [
            {
              pattern: /\/\/# sourceMappingURL=.*/g,
              replacement: ""
            }
          ]
        }
      },
      "eslint-rules": {
        files: [
          {
            src: "README.md",
            dest: "README.md"
          },
          {
            src: path.join(pageTemplateSnippetsDir, "boomerangSnippetNoScript.tpl"),
            dest: path.join(pageTemplateSnippetsDir, "boomerangSnippetNoScript.tpl")
          }
        ],
        options: {
          replacements: [
            {
              pattern: /\/\* eslint-.*\*\/\n/g,
              replacement: ""
            }
          ]
        }
      }
    },
    strip_code: {
      debug: {
        files: [{
          src: buildRelease
        }],
        options: {
          start_comment: "BEGIN_DEBUG",
          end_comment: "END_DEBUG"
        }
      },
      "debug-log": {
        files: [{
          src: buildRelease
        }],
        options: {
          patterns: [
            /BOOMR\.debug\(.*\);/g,
            /BOOMR\.info\(.*\);/g,
            /BOOMR\.warn\(.*\);/g,
            /BOOMR\.error\(.*\);/g,
            /debugLog\(.*\);/g
          ]
        }
      },
      prod: {
        files: [
          {
            src: buildDebug
          },
          {
            src: "<%= testBuildPathPrefix %>*.js"
          }
        ],
        options: {
          start_comment: "BEGIN_PROD",
          end_comment: "END_PROD"
        }
      },
      "test-code": {
        files: [{
          src: [
            "README.md"
          ]
        }],
        options: {
          start_comment: "BEGIN_TEST_CODE",
          end_comment: "END_TEST_CODE"
        }
      },
      "snippets": {
        files: [{
          src: path.join(buildSnippetsStrippedDir, "*.js")
        }],
        options: {
          start_comment: "BEGIN_TEST_CODE",
          end_comment: "END_TEST_CODE"
        }
      }
    },
    copy: {
      webserver: {
        files: [
          {
            expand: true,
            nonull: true,
            cwd: "tests/",
            src: "**/*",
            force: true,
            dest: env.publish + "/"
          }
        ]
      },
      "coverage-e2e": {
        files: [
          {
            src: [
              "tests/pages/**/*",
              "tests/e2e/**/*",
              "tests/server/**/*",
              "tests/vendor/**/*",
              "tests/test-templates/**/*",
              "tests/boomerang-test-framework.js",
              "tests/boomerang-test-plugin.js"
            ],
            force: true,
            dest: "tests/instrumented/"
          }
        ]
      },
      "perf-baseline": {
        files: [
          {
            expand: false,
            nonull: true,
            src: "tests/perf/results/metrics.json",
            force: true,
            dest: "tests/perf/results/baseline.json"
          }
        ]
      },
      "snippets-stripped": {
        files: [
          {
            expand: true,
            nonull: true,
            cwd: snippetsDir,
            src: "*.js",
            force: true,
            dest: buildSnippetsStrippedDir
          }
        ]
      }
    },
    uglify: {
      options: {
        banner: bannerString + "/* Boomerang Version: <%= boomerangVersion %> " +
          (grunt.option("commit") || "<%= githash.main.hash %>") + " */\n"
      },
      default: {
        options: DEFAULT_UGLIFY_BOOMERANGJS_OPTIONS,
        files: [{
          expand: true,
          cwd: "build/",
          src: [
            "<%= buildFilePrefix %>-debug.<%= buildSuffix %>js",
            "<%= buildFilePrefix %>.<%= buildSuffix %>js"
          ],
          dest: "build/",
          ext: ".min.js",
          extDot: "last"
        }]
      },
      "debug-test-min": {
        options: DEFAULT_UGLIFY_BOOMERANGJS_OPTIONS,
        files: [{
          src: buildTest,
          dest: buildTestMin
        }]
      },
      "inline-consent-plugin": {
        options: {
          preserveComments: false,
          mangle: true,
          banner: "",
          sourceMap: false,
          compress: {
            sequences: false
          }
        },
        files: [{
          src: "plugins/consent-inlined-plugin.js",
          dest: path.join(pageTemplateSnippetsDir, "consentInlinePluginNoScriptMin.tpl")
        }]
      },
      plugins: {
        options: {
          preserveComments: false,
          mangle: true,
          banner: "",
          sourceMap: true,
          compress: {
            sequences: false
          }
        },
        files: [{
          expand: true,
          cwd: "plugins/",
          src: ["./*.js"],
          dest: buildPluginsDir,
          ext: ".min.js",
          extDot: "first"
        }]
      },
      snippets: {
        options: {
          preserveComments: false,
          mangle: true,
          banner: "",
          // NOTE: Not compressing so things like our <bo + dy> optimization aren't removed
          compress: false
        },
        files: [{
          expand: true,
          cwd: buildSnippetsStrippedDir,
          src: [
            "*.js"
          ],
          dest: buildSnippetsDir,
          ext: ".min.js",
          extDot: "first"
        }]
      }
    },
    compress: {
      main: {
        options: {
          mode: "gzip",
          level: 9
        },
        files: [
          {
            src: buildRelease,
            dest: buildReleaseGz
          },
          {
            src: buildDebug,
            dest: buildDebugGz
          },
          {
            src: buildReleaseMin,
            dest: buildReleaseMinGz
          },
          {
            src: buildDebugMin,
            dest: buildDebugMinGz
          }
        ]
      },
      plugins: {
        options: {
          mode: "gzip",
          level: 9
        },
        files: [{
          expand: true,
          cwd: buildPluginsDir,
          src: "./*.js",
          dest: buildPluginsDir,
          ext: ".min.js.gz",
          extDot: "first"
        }]
      }
    },
    "babel": {
      "spa-react-test-templates": {
        files: {
          "tests/page-templates/12-react/support/app-component.js": "tests/page-templates/12-react/support/app.jsx"
        }
      }
    },
    browserify: {
      "spa-react-test-templates": {
        files: {
          "tests/page-templates/12-react/support/app.js": [
            "node_modules/react/dist/react.js",
            "node_modules/react-dom/dist/react-dom.js",
            "node_modules/react-router/umd/ReactRouter.js",
            "tests/page-templates/12-react/support/app-component.js"
          ]
        }
      }
    },
    filesize: {
      csv: {
        files: [{
          expand: true,
          cwd: "build",
          src: ["./**/*.min.js", "./**/*.min.js.gz"],
          ext: ".min.js.gz",
          extDot: "first"
        }],
        options: {
          output: {
            path: "tests/results/filesizes.csv",
            // https://github.com/k-maru/grunt-filesize/issues/8
            format: "\"{filename}\",{size},{kb},{now:YYYYMMDDhhmmss};",
            append: true
          }
        }
      },
      console: {
        files: [{
          expand: true,
          cwd: "build",
          src: ["./**/*.min.js", "./**/*.min.js.gz"],
          ext: ".min.js.gz",
          extDot: "first"
        }],
        options: {
          output: {
            format: "{filename}: Size of {size:0,0} bytes ({kb:0.00} kilobyte)",
            stdout: true
          }
        }
      }
    },
    clean: {
      options: {},
      build: [
        "build/*",
        "tests/build/*",
        "tests/results/*.tap",
        "tests/results/*.xml",
        "tests/coverage/*",
        "tests/pages/**/*",
        "tests/instrumented/**/*"
      ],
      "spa-react-test-templates": [
        "tests/pages/12-react/support/app.js",
        "tests/page-templates/12-react/support/app.js",
        "tests/page-templates/12-react/support/app-component.js",
        "tests/page-templates/12-react/support/*.map"
      ],
      src: ["plugins/*~", "*.js~", "*.html~"]
    },
    karma: {
      options: {
        singleRun: true,
        colors: true,
        configFile: "./tests/karma.config.js",
        basePath: "./",
        files: [
          // relative to tests/ dir
          "vendor/mocha/mocha.css",
          "vendor/mocha/mocha.js",
          "vendor/assertive-chai/dist/assertive-chai.js",
          "boomerang-test-framework.js",
          "unit/*.js",
          "build/*.js"
        ],
        hostname: DEFAULT_TEST_MAIN_DOMAIN,
        SELENIUM_ADDRESS: grunt.option("selenium-address")
      },
      unit: {
        browsers: [DEFAULT_BROWSER]
      },
      coverage: {
        browsers: [DEFAULT_BROWSER],
        configFile: "./tests/karma.coverage.config.js"
      },
      all: {
        browsers: [
          "Chrome",
          "ChromeHeadless",
          "Edge",
          "Firefox",
          "FirefoxHeadless",
          "IE",
          "Opera",
          "Safari",
          "Edge"
        ]
      },
      allHeadless: {
        browsers: [
          "ChromeHeadless",
          "FirefoxHeadless"
        ]
      },
      Chrome: {
        browsers: ["Chrome"]
      },
      ChromeHeadless: {
        browsers: ["ChromeHeadless"]
      },
      Firefox: {
        browsers: ["Firefox"]
      },
      FirefoxHeadless: {
        browsers: ["FirefoxHeadless"]
      },
      IE: {
        browsers: ["IE"]
      },
      Edge: {
        browsers: ["Edge"]
      },
      Opera: {
        browsers: ["Opera"]
      },
      Safari: {
        browsers: ["Safari"]
      },
      debug: {
        singleRun: false
      }
    },
    protractor: {
      options: {
        noColor: false,
        keepAlive: false
      },
      Chrome: {
        options: {
          configFile: "tests/protractor-config/chrome.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      },
      ChromeHeadless: {
        options: {
          configFile: "tests/protractor-config/chromeheadless.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      },
      Firefox: {
        options: {
          configFile: "tests/protractor-config/firefox.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      },
      FirefoxHeadless: {
        options: {
          configFile: "tests/protractor-config/firefoxheadless.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      },
      Edge: {
        options: {
          configFile: "tests/protractor-config/edge.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      },
      IE: {
        options: {
          configFile: "tests/protractor-config/ie.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      },
      Safari: {
        options: {
          configFile: "tests/protractor-config/safari.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      },
      debug: {
        options: {
          configFile: "tests/protractor-config/debug.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/e2e/e2e-debug.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      }
    },
    protractor_webdriver: {
      options: {
        keepAlive: true,
        command: "webdriver-manager start " + (webDriverVersions || "")
      },
      e2e: {}
    },
    // Instrument code for e2e tests coverage
    instrument: {
      files: [
        "tests/build/*.js"
      ],
      options: {
        lazy: true,
        basePath: "tests/instrumented"
      }
    },
    protractor_coverage: {
      options: {
        noColor: false,
        keepAlive: true,
        coverageDir: "tests/instrumented/coverage"
      },
      ChromeHeadless: {
        options: {
          configFile: "tests/protractor-config/chromeheadless.js",
          args: {
            seleniumAddress: SELENIUM_ADDRESS,
            specs: ["tests/instrumented/tests/e2e/e2e.js"],
            baseUrl: E2E_BASE_URL
          }
        }
      }
    },
    makeReport: {
      src: "tests/instrumented/coverage/**/*.json",
      options: {
        type: "html",
        dir: "tests/coverage/e2e",
        print: "detail"
      }
    },
    express: {
      options: {
        port: TEST_DEBUG_PORT,
        hostname: "0.0.0.0"
      },
      dev: {
        options: {
          script: "tests/server/app.js",
          args: [TEST_SCHEME || "http"]
        }
      },
      secondary: {
        options: {
          script: "tests/server/app.js",
          port: (TEST_DEBUG_PORT + 1),
          args: [TEST_SCHEME || "http"]
        }
      },
      "coverage-e2e": {
        options: {
          script: "tests/instrumented/tests/server/app.js",
          args: [TEST_SCHEME || "http"],
          bases: ["tests/instrumented/tests/e2e", "tests/instrumented/tests/pages", "tests/instrumented/tests/server"]
        }
      },
      doc: {
        options: {
          port: (TEST_DEBUG_PORT - 1),
          script: "tests/server/doc-server.js"
        }
      }
    },
    "saucelabs-mocha": {
      unit: {
        options: Object.assign({
          urls: [TEST_URL_BASE + "unit/"],
          testname: "Boomerang Unit Tests",
          browsers: browserUnitTests
        }, SAUCELABS_CONFIG)
      },
      "unit-debug": {
        options: Object.assign({
          urls: [TEST_URL_BASE + "unit/"],
          testname: "Boomerang Unit Tests",
          browsers: [{
            browserName: "internet explorer",
            "version": "11",
            "platform": "Windows 8.1"
          }]
        }, SAUCELABS_CONFIG)
      },
      e2e: {
        options: Object.assign({
          urls: e2eUrls,
          testname: "Boomerang E2E Tests",
          browsers: browserUnitTests
        }, SAUCELABS_CONFIG)
      },
      "e2e-debug": {
        options: Object.assign({
          urls: e2eUrls,
          testname: "Boomerang E2E Tests",
          browsers: [{
            browserName: "internet explorer",
            "version": "11",
            "platform": "Windows 8.1"
          }]
        }, SAUCELABS_CONFIG)
      }
    },
    jsdoc: {
      dist: {
        src: ["boomerang.js", "plugins/*.js"],
        jsdoc: "./node_modules/jsdoc/jsdoc.js",
        options: {
          destination: "build/doc",
          package: "package.json",
          readme: "README.md",
          configure: "jsdoc.conf.json",
          template: "doc-template"
        }
      }
    },
    watch: {
      test: {
        files: [
          "tests/e2e/*.js",
          "tests/page-template-snippets/**/*",
          "tests/page-templates/**/*",
          "tests/unit/**/*",
          "tests/test-templates/**/*.js",
          "!tests/page-templates/12-react/support/*.jsx",
          "!*.#*",
          "!*~",
          "!#*#"
        ],
        tasks: ["pages-builder"]
      },
      "test-react": {
        files: [
          "tests/page-templates/12-react/support/*.jsx"
        ],
        tasks: ["test:build:react"]
      },
      boomerang: {
        files: [
          "boomerang.js",
          "plugins/*.js",
          "plugins.json"
        ],
        tasks: ["build:test"]
      },
      express: {
        files: [
          "tests/server/*.js"
        ],
        tasks: ["express:dev", "express:secondary"]
      },
      doc: {
        files: [
          "boomerang.js",
          "plugins/*.js",
          "doc/**/**",
          "README.md"
        ],
        tasks: ["clean", "jsdoc", "doc-source-code"]
      }
    },
    shell: {
      "generate-certificate": {
        stdin: true,
        command: [
          "openssl req",
          "-x509",
          "-newkey rsa:4096",
          "-sha256",
          "-days 3560",
          "-nodes",
          "-keyout tests/server/certs/" + DEFAULT_TEST_MAIN_DOMAIN + ".pem",
          "-out tests/server/certs/" + DEFAULT_TEST_MAIN_DOMAIN + ".crt",
          "-subj '/CN=" + DEFAULT_TEST_MAIN_DOMAIN + "'",
          "-extensions san",
          "-config /dev/stdin"
        ].join(" ")
      }
    }
  };
}

//
// Grunt call
//
module.exports = function() {
  //
  // Paths
  //
  var testsDir = path.join(__dirname, "tests");
  var perfTestsDir = path.join(testsDir, "perf");
  var pageTemplateSnippetsDir = path.join(testsDir, "page-template-snippets");
  var pluginsDir = path.join(__dirname, "plugins");
  var snippetsDir = path.join(__dirname, "snippets");
  //
  // Config
  //

  grunt.initConfig(getConfig());
  var buildConfig = getBuildConfig();

  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-express-server");
  grunt.loadNpmTasks("grunt-karma");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-string-replace");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-filesize");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.loadNpmTasks("grunt-protractor-runner");
  grunt.loadNpmTasks("grunt-protractor-webdriver");
  grunt.loadNpmTasks("grunt-protractor-coverage");
  grunt.loadNpmTasks("grunt-template");
  grunt.loadNpmTasks("grunt-saucelabs");
  grunt.loadNpmTasks("grunt-strip-code");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-jsdoc");
  grunt.loadNpmTasks("grunt-githash");
  grunt.loadNpmTasks("grunt-shell");
  grunt.loadNpmTasks("grunt-istanbul");

  // tasks/*.js
  if (grunt.file.exists("tasks")) {
    grunt.loadTasks("tasks");
  }

  grunt.registerTask("pages-builder", "Builds our HTML tests/pages", function() {
    return require(path.join(testsDir, "builder"))(
      this,
      path.join(testsDir, "page-templates"),
      pageTemplateSnippetsDir,
      path.join(testsDir, "pages"),
      path.join(testsDir, "e2e"),
      path.join(testsDir, "e2e", "e2e.json")
    );
  });

  grunt.registerTask("pages-builder-perf", "Builds our HTML tests/pages for Perf Testing", function() {
    return require(path.join(testsDir, "builder"))(
      this,
      path.join(testsDir, "perf", "page-templates"),
      pageTemplateSnippetsDir,
      path.join(testsDir, "perf", "pages"),
      path.join(testsDir, "perf", "pages"),
      path.join(testsDir, "perf", "scenarios.json")
    );
  });

  // Custom aliases for configured grunt tasks
  var aliases = {
    "default": ["lint", "build", "test", "metrics"],

    //
    // Build
    //
    "build": [
      "concat",
      "build:apply-templates",
      "githash",
      "copy:snippets-stripped",
      "strip_code:snippets",
      "uglify",
      "string-replace:remove-sourcemappingurl",
      "compress",
      "metrics"
    ],

    "build:test": [
      "concat:debug",
      "concat:debug-tests",
      "!build:apply-templates",
      "uglify:debug-test-min",
      "uglify:inline-consent-plugin"
    ],

    // Build steps
    "build:apply-templates": [
      "string-replace:all",
      "!string-replace:debug-tests",
      "string-replace:release",
      "!strip_code:debug",
      "!strip_code:debug-log",
      "!strip_code:prod"
    ],

    // metrics to generate
    "metrics": ["filesize:console"],

    //
    // Lint
    //
    "lint": ["eslint"],
    "lint:fix": ["eslint:fix"],

    //
    // Docs
    //
    "doc-source-code": [
      "uglify:plugins",
      "string-replace:plugins-remove-sourcemappingurl",
      "string-replace:doc-source-code"
    ],

    // Documentation
    "doc": [
      "string-replace:readme",
      "strip_code:test-code",
      "string-replace:eslint-rules",
      "jsdoc",
      "strip_code:test-code",
      "doc-source-code"
    ],
    "test:doc": ["clean", "jsdoc", "doc-source-code", "express:doc", "watch:doc"],

    //
    // Test tasks
    //
    "test": ["build", "test:build", "test:unit", "test:e2e"],

    // builds test files
    "test:build": ["mkdir:test", "test:build:react", "pages-builder", "build"],

    // react test files
    "test:build:react": ["babel:spa-react-test-templates", "browserify:spa-react-test-templates"],

    // useful for debugging tests, leaves a webbrowser open at http://localhost:3001
    "test:debug": [
      "test:build",
      "build:test",
      "express:dev",
      "express:secondary",
      "test:debug:watch"
    ],

    // open your browser to http://localhost:4000/debug.html to debug
    "test:karma:debug": ["test:build", "build:test", "karma:debug"],

    // unit tests
    "test:unit": ["test:build", "build", "karma:unit:" + DEFAULT_BROWSER],
    "test:unit:all": ["build", "karma:all"],
    "test:unit:allHeadless": ["build", "karma:allHeadless"],
    "test:unit:Chrome": ["build", "karma:Chrome"],
    "test:unit:ChromeHeadless": ["build", "karma:ChromeHeadless"],
    "test:unit:Firefox": ["build", "karma:Firefox"],
    "test:unit:FirefoxHeadless": ["build", "karma:FirefoxHeadless"],
    "test:unit:Edge": ["build", "karma:Edge"],
    "test:unit:IE": ["build", "karma:IE"],
    "test:unit:Opera": ["build", "karma:Opera"],
    "test:unit:Safari": ["build", "karma:Safari"],

    // End-to-End tests
    "test:e2e": ["test:e2e:" + DEFAULT_BROWSER],
    "test:e2e:browser": ["test:build", "build", "express:dev", "express:secondary"],
    "test:e2e:debug": ["test:e2e:browser", "protractor:debug"],
    "test:e2e:Chrome": ["test:e2e:browser", "protractor:Chrome"],
    "test:e2e:ChromeHeadless": ["test:e2e:browser", "protractor:ChromeHeadless"],
    "test:e2e:Firefox": ["test:e2e:browser", "protractor:Firefox"],
    "test:e2e:FirefoxHeadless": ["test:e2e:browser", "protractor:FirefoxHeadless"],
    "test:e2e:Edge": ["test:e2e:browser", "protractor:Edge"],
    "test:e2e:IE": ["test:e2e:browser", "protractor:IE"],
    "test:e2e:Safari": ["test:e2e:browser", "protractor:Safari"],

    // SauceLabs tests
    "test:matrix": ["test:matrix:unit", "test:matrix:e2e"],
    "test:matrix:e2e": ["pages-builder", "saucelabs-mocha:e2e"],
    "test:matrix:e2e:debug": ["pages-builder", "saucelabs-mocha:e2e-debug"],
    "test:matrix:unit": ["saucelabs-mocha:unit"],
    "test:matrix:unit:debug": ["saucelabs-mocha:unit-debug"],

    //
    // Perf tasks
    //
    "perf": ["build", "pages-builder-perf", "express:dev", "perf-tests"],
    "perf:baseline": ["build", "pages-builder-perf", "express:dev", "perf-tests", "copy:perf-baseline"],
    "perf:compare": ["build", "pages-builder-perf", "express:dev", "perf-tests", "perf-compare"],

    //
    // Coverage tasks
    //
    "test:unit:coverage": ["test:build", "build", "karma:coverage:ChromeHeadless"],

    "test:e2e:coverage": [
      "test:build",
      "build",
      "copy:coverage-e2e",
      "instrument",
      "express:coverage-e2e",
      "protractor_webdriver",
      "protractor_coverage:ChromeHeadless",
      "makeReport:coverage-e2e"
    ],

    "test:coverage": ["test:unit:coverage", "test:e2e:coverage"]
  };

  // launch selenium if another address wasn't provided
  if (!grunt.option("selenium-address")) {
    aliases["test:e2e:browser"].push("protractor_webdriver");
  }

  function isAlias(task) {
    return aliases[task] ? true : false;
  }

  // tasks that need to be run more than once (denoted by starting with !)
  var rerunTasks = {};

  function resolveAlias(task) {
    var tasks = aliases[task],
        resolved = false;

    function checkDuplicates(insertableTask) {
      if (rerunTasks[insertableTask]) {
        // always return true for tasks that were marked as rerun
        return true;
      }

      return tasks.indexOf(insertableTask) === -1;
    }

    while (!resolved) {
      if (tasks.filter(isAlias).length === 0) {
        resolved = true;
      }

      for (var index = 0; index < tasks.length; index++) {
        // if the task starts with !, it should be run more than once
        if (tasks[index].startsWith("!")) {
          // trim back to the real name
          tasks[index] = tasks[index].substr(1);

          // keep track of this task
          rerunTasks[tasks[index]] = true;
        }

        if (isAlias(tasks[index])) {
          var aliasTask = tasks[index];
          var beforeTask = tasks.slice(0, index);
          var afterTask = tasks.slice(index + 1, tasks.length);
          var insertTask = aliases[aliasTask].filter(checkDuplicates);

          tasks = [].concat(beforeTask, insertTask, afterTask);
        }
      }
    }

    return tasks;
  }

  Object.keys(aliases).map(function(alias) {
    var resolved = resolveAlias(alias);

    grunt.log.debug("Resolving task alias: " + alias + " to " + JSON.stringify(resolved));
    grunt.registerTask(alias, resolved);
  });

  // Don't re-generate Docs during test:debug builds running
  grunt.registerTask("test:debug:watch", function() {
    delete grunt.config.data.watch.doc;
    grunt.task.run("watch");
  });

  //
  // build:flavors
  //
  grunt.registerTask("build:flavors", function() {
    var done = this.async();

    // config
    var buildNumber = grunt.option("build-number") || 0;

    if (buildNumber === 0) {
      grunt.fail.fatal("--build-number must be specified");
    }

    runForEachFlavor(
      "build",
      "build",
      [
        "--build-number=" + buildNumber
      ],
      true,
      done);
  });

  //
  // test:unit:flavors
  //
  grunt.registerTask("test:unit:flavors", function() {
    var done = this.async();

    runForEachFlavor(
      "test-unit",
      "test:unit",
      [],
      false,
      done);
  });

  //
  // test:e2e:flavors
  //
  grunt.registerTask("test:e2e:flavors", function() {
    var done = this.async();

    // protractor_webdriver should've already been started so we can reuse it
    grunt.task.requires("protractor_webdriver");

    runForEachFlavor(
      "test-e2e",
      "test:e2e",
      [
        "--selenium-address=" + SELENIUM_ADDRESS
      ],
      false,
      done);
  });
};

/**
 * Runs the specific task for each build flavor
 *
 * @param {string} logName Log file name
 * @param {string} taskName Grunt task name
 * @param {string[]} args Grunt command-line arguments
 * @param {boolean} failOnError Fail on error
 * @param {function} done Callback
 */
function runForEachFlavor(logName, taskName, args, failOnError, done) {
  // get all plugin definitions
  var plugins = grunt.file.readJSON("plugins.json");

  var pkg = grunt.file.readJSON("package.json");
  var buildNumber = grunt.option("build-number") || 0;
  var releaseVersion = pkg.releaseVersion + "." + buildNumber;

  var flavorList = [];

  // Add the base "full" version as its also a flavor.
  flavorList.push(releaseVersion + ".0");

  // Build list of all flavor version codes in this release
  for (var f in plugins.flavors) {
    if (!plugins.flavors.hasOwnProperty(f)) {
      continue;
    }

    var buildFlavor = plugins.flavors[f];

    flavorList.push(releaseVersion + "." + buildFlavor.revision);
  }

  // output log
  var outputLogFile = path.join("build", logName + ".full.log");
  var outputLogStream = fs.createWriteStream(outputLogFile, {
    flags: "a"
  });

  grunt.log.ok("Running " + taskName + " on full build");

  // Let the environment know the flavor
  process.env.BUILD_FLAVOR = "full";

  var argsWithTask = args.concat(taskName);
  var argsWithTaskAndFlavors = argsWithTask.concat([
    "--parent-flavor-version=" + releaseVersion + ".0",
    "--is-parent-flavor=true",
    "--is-child-flavor=false"
  ]);
  //
  // Full build
  //
  var child = grunt.util.spawn({
    grunt: true,
    args: argsWithTaskAndFlavors
  }, function(error, result, code) {
    outputLogStream.close();

    if (error) {
      logSpawnError(error, result);

      if (failOnError) {
        grunt.fail.fatal("Build failed");

        return done("Build failed");
      }
    }

    // set parent flavor version
    var argsWithTaskAndPVersion = argsWithTask.concat([
      "--parent-flavor-version=" + releaseVersion + ".0",
      "--is-parent-flavor=false",
      "--is-child-flavor=true"
    ]);
    //
    // Each flavor
    //

    async.eachSeries(Object.keys(plugins.flavors), function(flavor, cb) {
      // Let the environment know the flavor
      process.env.BUILD_FLAVOR = flavor;

      // output log
      outputLogFile = path.join("build", logName + "." + flavor + ".log");
      outputLogStream = fs.createWriteStream(outputLogFile, {
        flags: "a"
      });

      grunt.log.ok("Running " + taskName + " on " + flavor);

      var child2 = grunt.util.spawn({
        grunt: true,
        args: argsWithTaskAndPVersion.concat("--build-flavor=" + flavor)
      }, function(errorFlavor, resultFlavor) {
        outputLogStream.close();

        if (errorFlavor) {
          logSpawnError(errorFlavor, resultFlavor);
        }

        cb((failOnError && errorFlavor) ? ("Error with " + flavor) : undefined);
      });

      child2.stdout.pipe(outputLogStream);
      child2.stderr.pipe(outputLogStream);
    }, done);
  });

  child.stdout.pipe(outputLogStream);
  child.stderr.pipe(outputLogStream);
}

function logSpawnError(error, result) {
  // Log output
  console.log(error);

  if (result.stderr) {
    console.error("********* stderr *********");
    console.error(result.stderr);
  }

  if (result.stdout) {
    console.error("********* stdout *********");
    console.error(result.stdout);
  }
}
