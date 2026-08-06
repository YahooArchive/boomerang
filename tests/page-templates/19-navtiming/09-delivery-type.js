/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/19-navtiming/09-delivery-type", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set nt_dtype deliveryType (if supported)", function() {
    if (!t.isNavigationTiming2Supported()) {
      return this.skip();
    }

    assert.equal("cache", tf.beacons[0].nt_dtype);
  });
});
