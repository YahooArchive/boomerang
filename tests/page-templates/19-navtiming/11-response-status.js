/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/19-navtiming/11-response-status", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set nt_st responseStatus (if supported)", function() {
    if (!t.isNavigationTiming2Supported()) {
      return this.skip();
    }

    assert.equal(410, tf.beacons[0].nt_st);
  });
});
