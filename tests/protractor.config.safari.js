/* eslint-env node */
/* global jasmine */

exports.config = {
  onPrepare: function() {
    var reporters = require("jasmine-reporters");

    jasmine.getEnv().addReporter(new jasmine.ConsoleReporter({
      print: console.log,
      showColors: true
    }));

    jasmine.getEnv().addReporter(new reporters.JUnitXmlReporter({
      savePath: "tests/results",
      consolidate: true,
      consolidateAll: true,
      useDotNotation: true,
      filePrefix: "e2e" + (process.env.BUILD_FLAVOR ? ("-" + process.env.BUILD_FLAVOR) : "")
    }));
  },
  // needs to be specified here (instead of in Gruntfile.js) - grunt-protractor-runner seems
  // to have an issue passing in args
  capabilities: {
    // technologyPreview: true,  // uncomment to use Safari Technology Preview
    browserName: "safari"
  }
};
