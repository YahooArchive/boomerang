/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["LargestContentfulPaint"]);

describe("e2e/20-painttiming/12-lcp-reset", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent one beacon", function(done) {
    t.ensureBeaconCount(done, 1);
  });

  describe("Beacon 1", function() {
    it("Should have no LCP metric src (pt.lcp.src) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.equal(b["pt.lcp"], BOOMR.plugins.PaintTiming.metrics.lcp());

      assert.isUndefined(b["pt.lcp.src"]);
    });

    it("Should have no LCP metric element (pt.lcp.el) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isUndefined(b["pt.lcp.el"]);
    });

    it("Should have no LCP metric ID (pt.lcp.id) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isUndefined(b["pt.lcp.id"]);
    });

    it("Should have no LCP metric Pseudo-CSS Selector (pt.lcp.e) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isUndefined(b["pt.lcp.e"]);
    });

    it("Should have exposed LCP metric size (pt.lcp.s) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isTrue(Number.isInteger(b["pt.lcp.s"]));

      assert.equal(b["pt.lcp.s"], BOOMR.plugins.PaintTiming.metrics.lcpS());
    });
  });
});
