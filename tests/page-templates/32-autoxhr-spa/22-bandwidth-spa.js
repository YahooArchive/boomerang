/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/32-autoxhr-spa/22-brandwidth-spa.js", function() {
  var t = BOOMR_test;

  var tf = BOOMR.plugins.TestFramework;

  it("Should return bandwidth in beacon", function() {
    if (!t.isNetworkAPISupported()) {
      return;
    }

    var b = tf.beacons[0];

    assert.isFalse(b.bw_time === null, "bw_time should not be null");
    assert.isTrue(b.bw_time > 0, "bw_time should be a positive number");
    assert.isFalse(isNaN(b.bw), "bw should be a number");
    assert.isFalse(isNaN(b.bw_err), "bw_err should be a number");
  });
});
