/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/21-continuity/47-ttvr-prerendered", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have set the Time to Visually Ready (c.tti.vr), offset by Activation Start", function() {
    if (!t.isNavigationTimingSupported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.tti.vr"]);

    var ttivr = parseInt(b["c.tti.vr"], 10);

    assert.equal(ttivr, 1);
  });
});
