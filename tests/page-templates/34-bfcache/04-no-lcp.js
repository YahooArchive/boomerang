/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/34-bfcache/04-no-lcp", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent two beacons", function(done) {
    t.ensureBeaconCount(done, 2);
  });

  describe("Beacon 1 - Page Load", function() {
    it("Should have been an Page Load beacon", function() {
      var b = tf.beacons[0];

      assert.isUndefined(b["http.initiator"]);
    });
  });

  describe("Beacon 1 - BFCache", function() {
    it("Should have been a BFCache beacon", function() {
      var b = tf.beacons[1];

      assert.equal(b["http.initiator"], "bfcache");
    });

    it("Should have set pt.fcp > 0", function() {
      var b = tf.beacons[1];

      assert.operator(parseInt(b["pt.fcp"], 10), ">", 450);
    });

    it("Should NOT have set pt.lcp", function() {
      var b = tf.beacons[1];

      assert.isUndefined(b["pt.lcp"]);
    });
  });
});
