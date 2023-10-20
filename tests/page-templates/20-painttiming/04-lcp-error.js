/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/20-painttiming/04-lcp-error", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var C = BOOMR.utils.Compression;

  it("Should have sent two beacons", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 2);
  });

  describe("No LCP data on Error Beacon", function() {
    it("Should have error data set on first beacon", function(){
      assert.notEqual(typeof tf.beacons[0].err, "undefined");
    });

    it("Should not have LCP data on the error beacon", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.equal(typeof tf.beacons[0]["pt.lcp"], "undefined");
    });

    it("Should be a test error on the error beacon", function() {
      var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(tf.beacons[0].err))[0];

      // message defined in html file
      assert.equal(err.message, "ERROR!");
    });
  });

  describe("LCP data on Pageload Beacon", function(){
    it("Should have only sent error information on the error beacon", function() {
      assert.equal(typeof tf.lastBeacon().err, "undefined");
    });

    it("Should have set pt.lcp (if LargestContentfulPaint is supported and happened by load)", function(done) {
      var observerWait,
          that = this;

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      var observer = new window.PerformanceObserver(function(list) {
        clearTimeout(observerWait);

        var entries = list.getEntries();

        if (entries.length === 0) {
          return that.skip();
        }

        var lcp = entries[entries.length - 1];
        var lcpTime = lcp.renderTime || lcp.loadTime;

        // validation of First Paint
        assert.isNumber(tf.lastBeacon()["pt.lcp"]);
        assert.operator(parseInt(tf.lastBeacon()["pt.lcp"], 10), ">=", 0);
        assert.equal(tf.lastBeacon()["pt.lcp"], Math.floor(lcpTime));

        observer.disconnect();

        done();
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });

      // wait for the LCP observer to fire, if not, skip the test
      observerWait = setTimeout(function() {
        // no LCP before load
        return this.skip();
      }.bind(this), 3000);
    });

    it("Should have exposed LCP metric (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.equal(tf.lastBeacon()["pt.lcp"], BOOMR.plugins.PaintTiming.metrics.lcp());
    });

    it("Should have exposed LCP metric src (pt.lcp.src) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.equal(tf.lastBeacon()["pt.lcp"], BOOMR.plugins.PaintTiming.metrics.lcp());

      assert.isString(tf.lastBeacon()["pt.lcp.src"]);

      assert.equal(tf.lastBeacon()["pt.lcp.src"], BOOMR.plugins.PaintTiming.metrics.lcpSrc());
      assert.include(tf.lastBeacon()["pt.lcp.src"], "delay?delay=2000&file=/assets/img.jpg&id=2000");
    });

    it("Should have exposed LCP metric element (pt.lcp.el) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isString(tf.lastBeacon()["pt.lcp.el"]);

      assert.equal(tf.lastBeacon()["pt.lcp.el"], BOOMR.plugins.PaintTiming.metrics.lcpEl());
      assert.equal(tf.lastBeacon()["pt.lcp.el"], "IMG");
    });

    it("Should not have exposed LCP metric ID (pt.lcp.id) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.notProperty(tf.lastBeacon(), "pt.lcp.id");
    });

    it("Should have exposed LCP metric Pseudo-CSS Selector (pt.lcp.e) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isString(tf.lastBeacon()["pt.lcp.e"]);

      assert.equal(tf.lastBeacon()["pt.lcp.e"], BOOMR.plugins.PaintTiming.metrics.lcpE());
      assert.equal(tf.lastBeacon()["pt.lcp.e"], "img");
    });

    it("Should not have exposed LCP metric src-set (pt.lcp.srcset) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.notProperty(tf.lastBeacon(), "pt.lcp.srcset");
    });

    it("Should not have exposed LCP metric sizes (pt.lcp.sizes) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.notProperty(tf.lastBeacon(), "pt.lcp.sizes");
    });

    it("Should have exposed LCP metric size (pt.lcp.s) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
        // No paint
        return this.skip();
      }

      assert.isTrue(Number.isInteger(tf.lastBeacon()["pt.lcp.s"]));

      assert.equal(tf.lastBeacon()["pt.lcp.s"], BOOMR.plugins.PaintTiming.metrics.lcpS());
    });
  });
});
