/*eslint-env node*/
/*global jasmine*/

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
      filePrefix: "e2e-debug"
    }));
  },
  // needs to be specified here (instead of in Gruntfile.js) - grunt-protractor-runner seems
  // to have an issue passing in args
  capabilities: {
    browserName: "chrome",
    chromeOptions: {
      args: [
        "--headless",
        "--disable-gpu",
        "--window-size=1024,768",
        "--remote-debugging-port=9222"
      ]
    },
    loggingPrefs: {
      "driver": "INFO",
      "browser": "INFO"
    }
  }
};
