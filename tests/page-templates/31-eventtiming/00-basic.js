/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["PerformanceEventTiming", "POs", "EVENT_TYPES"]);

describe("e2e/31-eventtiming/00-basic", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have included raw events (et.e) on the beacon", function() {
    if (BOOMR.utils.Compression && BOOMR.utils.Compression.jsUrl) {
      // ensure a few items are there

      // ensure FID is there
      assert.include(tf.lastBeacon()["et.e"], "~(c~0~d~'p0~fi~1~i~'a~p~'nm~s~'2s)");

      // ensure click is there
      assert.include(tf.lastBeacon()["et.e"], "~(c~0~d~'1f~i~'2t~n~0~p~'1e~s~'rt)");
    }
    else {
      assert.isDefined(tf.lastBeacon()["et.e"]);
    }
  });

  it("Should have included a map for each event in the events list (et.e) on the beacon", function() {
    if (BOOMR.utils.Compression && BOOMR.utils.Compression.jsUrl) {
      for (var eventName in window.EVENT_TYPES) {
        assert.include(tf.lastBeacon()["et.e"], "n~" + window.EVENT_TYPES[eventName]);
      }
    }
    else {
      assert.isDefined(tf.lastBeacon()["et.e"]);
    }
  });

  it("Should have included First Input Delay (et.fid) on the beacon", function() {
    assert.equal(tf.lastBeacon()["et.fid"], 50);
  });

  it("Should have included Continuity's Time to First Interaction (TTFI) (c.ttfi) on the beacon if Continuity is included", function() {
    if (!BOOMR.plugins.Continuity) {
      return this.skip();
    }

    assert.equal(tf.lastBeacon()["c.ttfi"], 100);
  });

  it("Should have included Continuity's Time to First Interaction (TTFI) (c.ttfi) on the beacon if Continuity is NOT included", function() {
    if (BOOMR.plugins.Continuity) {
      return this.skip();
    }

    assert.equal(tf.lastBeacon()["c.ttfi"], 100);
  });
});
