/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/19-navtiming/07-content-type", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have seen a beacon in the IFRAME", function() {
    assert.isDefined(tf.frameBeacon);
  });

  it("Should have set nt_ctype contentType (if supported)", function() {
    if (!t.isNavigationTiming2Supported()) {
      return this.skip();
    }

    var frameContentType = window.frames[0].performance.getEntriesByType("navigation")[0].contentType;

    assert.equal(frameContentType, tf.frameBeacon.nt_ctype);
  });
});
