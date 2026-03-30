/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_start"]);

describe("e2e/36-bw/01-bw-cookie.js", function() {
  var t = BOOMR_test;

  var tf = BOOMR.plugins.TestFramework;

  it("Check bw info is not recalculated during cookie lifetime", function() {
    if (!t.isNetworkAPISupported()) {
      return;
    }

    var b = tf.beacons[0];

    assert(b.bw_time >= (BOOMR.now() / 1000) - 105);
    assert(b.bw_time < (BOOMR.now() / 1000) - 95);
    assert(b.bw_err === 2);
    assert(b.bw === 100);
    assert(b.lat === 10);
    assert(b.lat_err === 1);
  });
});
