/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/19-navtiming/08-critical-ch-restart", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set nt_cchr criticalCHRestart (if supported)", function() {
    if (!t.isNavigationTiming2Supported()) {
      return this.skip();
    }

    // 100ms offset
    assert.equal(100, tf.beacons[0].nt_cchr - tf.beacons[0].nt_nav_st);
  });
});
