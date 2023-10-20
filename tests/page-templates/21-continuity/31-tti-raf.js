/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/21-continuity/31-tti-raf", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have set the Visually Ready to First Paint or domContentLoadedEventEnd (c.tti.vr)", function() {
    var b = tf.lastBeacon();

    var vr = t.getFirstOrContentfulPaint();
    var p = window.performance;

    // domContentLoadedEventEnd
    if (p && p.timing && p.timing.domContentLoadedEventEnd) {
      vr = Math.max(vr, p.timing.domContentLoadedEventEnd);
    }

    if (vr) {
      var st = parseInt(b["rt.tstart"], 10);

      assert.isDefined(b["c.tti.vr"]);
      assert.closeTo(parseInt(b["c.tti.vr"], 10), vr - st, 20);
    }
  });

  it("Should have set the Time to Interactive (c.tti)", function() {
    var b = tf.lastBeacon();

    if (t.isNavigationTimingSupported()) {
      var workDoneTs = window.workDone - performance.timing.navigationStart;
      var workStartTs = window.workStart - performance.timing.navigationStart;

      assert.isDefined(b["c.tti"]);
      assert.operator(parseInt(b["c.tti"], 10), ">=", workStartTs);

      // the interval should end around the same time as workDoneTs, plus some rounding
      assert.operator(parseInt(b["c.tti"], 10), ">=", workDoneTs - 200);

      // should be minimum bound by TTVR
      var minTTI = Math.max(t.getFirstOrContentfulPaint() - performance.timing.navigationStart, workDoneTs);

      // should be within 200ms
      //
      // NOTE: Disabled for now, rAF is too imprecise in slower environments (e.g. Docker)
      // to expect it to be close to our expected values.
      //
      // assert.closeTo(parseInt(b["c.tti"], 10), minTTI, 200);
    }
  });

  it("Should have set the Time to Interactive Method to 'raf' (c.tti.m) (if requestAnimationFrame is supported)", function() {
    var b = tf.lastBeacon();

    if (!window.requestAnimationFrame) {
      return this.skip();
    }

    assert.isDefined(b["c.tti.m"]);

    assert.equal(b["c.tti.m"], "raf");
  });
});
