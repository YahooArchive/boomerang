// Karma configuration
// Generated on %DATE%

module.exports = function(config) {
  config.set({

      basePath: "./tests",

      port: 4000,
      runnerPort: 4001,
      logLevel: config.LOG_INFO,

      colors: true,
      autoWatch: false,

      frameworks: ["mocha"],
      reporters: ["progress","coverage"],
      browsers: ['PhantomJS'],

      coverageReporter: {
	  type : 'html',
	  dir : 'coverage/'
      }
  });
};




