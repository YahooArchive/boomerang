describe("e2e/20-painttiming/03-lcp-src", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent two beacons", function(done) {
    t.ensureBeaconCount(done, 2);
  });

  describe("Beacon 1", function() {
    it("Should have exposed LCP metric src (pt.lcp.src) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.equal(b["pt.lcp"], BOOMR.plugins.PaintTiming.metrics.lcp());

      assert.isString(b["pt.lcp.src"]);

      assert.equal(b["pt.lcp.src"], BOOMR.plugins.PaintTiming.metrics.lcpSrc());
      assert.include(b["pt.lcp.src"], "delay?delay=2000&file=/assets/img.jpg&id=2000");
    });

    it("Should have exposed LCP metric element (pt.lcp.el) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isString(b["pt.lcp.el"]);

      assert.equal(b["pt.lcp.el"], BOOMR.plugins.PaintTiming.metrics.lcpEl());
      assert.equal(b["pt.lcp.el"], "IMG");
    });

    it("Should have exposed LCP metric ID (pt.lcp.id) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isString(b["pt.lcp.id"]);

      assert.equal(b["pt.lcp.id"], BOOMR.plugins.PaintTiming.metrics.lcpId());
      assert.equal(b["pt.lcp.id"], "lcp-id");
    });

    it("Should have exposed LCP metric Pseudo-CSS Selector (pt.lcp.e) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isString(b["pt.lcp.e"]);

      assert.equal(b["pt.lcp.e"], BOOMR.plugins.PaintTiming.metrics.lcpE());
      assert.equal(b["pt.lcp.e"], "img#lcp-id");
    });

    it("Should have exposed LCP metric src-set (pt.lcp.srcset) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isString(b["pt.lcp.srcset"]);

      assert.equal(b["pt.lcp.srcset"], BOOMR.plugins.PaintTiming.metrics.lcpSrcset());
      assert.equal(b["pt.lcp.srcset"], "/delay?delay=2000&file=/assets/img.jpg&id=2000 1w, /delay?delay=2000&file=/assets/img.jpg&id=2000 9999w");
    });

    it("Should have exposed LCP metric sizes (pt.lcp.sizes) (if LargestContentfulPaint is supported and happened by load)", function() {
      var b = tf.beacons[0];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof b["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isString(b["pt.lcp.sizes"]);

      assert.equal(b["pt.lcp.sizes"], BOOMR.plugins.PaintTiming.metrics.lcpSizes());
      assert.equal(b["pt.lcp.sizes"], "(min-width: 1px) 2000px, 9999px");
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

  describe("Beacon 2", function() {
    it("Should not have exposed LCP attributes", function() {
      var b = tf.beacons[1];

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isUndefined(b["pt.lcp.src"]);
      assert.isUndefined(b["pt.lcp.el"]);
      assert.isUndefined(b["pt.lcp.id"]);
      assert.isUndefined(b["pt.lcp.e"]);
      assert.isUndefined(b["pt.lcp.srcset"]);
      assert.isUndefined(b["pt.lcp.sizes"]);
      assert.isUndefined(b["pt.lcp.s"]);
    });
  });
});
