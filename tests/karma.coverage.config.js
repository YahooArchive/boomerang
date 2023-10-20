/* eslint-env node */

var baseConfig = require("./karma.config.js");

module.exports = function(config) {
  baseConfig(config);
  config.reporters.push("coverage");
  config.plugins.push("karma-coverage");

  config.set({
    preprocessors: {
      "build/boomerang-latest-debug.js": ["coverage"]
    },
    coverageReporter: {
      dir: "coverage/unit/",
      instrumenterOptions: {
        istanbul: {esModules: false}  // Not an ES6 module.
      },
      reporters: [
        { type: "html", subdir: "html"},
        { type: "text", subdir: ".", file: "text.txt" },
        { type: "text-summary", subdir: ".", file: "text-summary.txt" }
      ]
    }
  });
};

