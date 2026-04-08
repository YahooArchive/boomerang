/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["PerformanceLongTaskTiming"]);

describe("e2e/21-continuity/48-tti-prerendered", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have set the LongTask count (c.lt.n) of 3 (if LongTasks are supported)", function() {
    if (!t.isLongTasksSupported()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.lt.n"]);

    // we caused at least 2
    assert.equal(parseInt(b["c.lt.n"], 10), 3);
  });

  it("Should have set the LongTask time (c.lt.tt) = 5020 (if LongTasks are supported)", function() {
    if (!t.isLongTasksSupported()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.lt.tt"]);

    // we caused 2x 10ms
    assert.equal(parseInt(b["c.lt.tt"], 10), 1020);
  });

  it("Should have set the LongTask data (c.lt) of all Long Tasks (if LongTasks are supported)", function() {
    if (!t.isLongTasksSupported()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    var ltData = BOOMR.utils.Compression.jsUrlDecompress(b["c.lt"]);

    assert.equal(ltData.length, 6);
  });
});
