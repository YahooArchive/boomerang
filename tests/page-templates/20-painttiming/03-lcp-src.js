describe("e2e/20-painttiming/03-lcp-src", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		t.ensureBeaconCount(done, 2);
	});

	describe("Beacon 1", function() {
		it("Should have exposed LCP metric src and element (if LargestContentfulPaint is supported and happened by load)", function() {
			var observerWait, that = this;
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
			assert.isString(b["pt.lcp.el"]);

			assert.equal(b["pt.lcp.src"], BOOMR.plugins.PaintTiming.metrics.lcpSrc());
			assert.equal(b["pt.lcp.el"], BOOMR.plugins.PaintTiming.metrics.lcpEl());
		});
	});

	describe("Beacon 2", function() {
		it("Should not have exposed LCP metric src and element", function() {
			var observerWait, that = this;
			var b = tf.beacons[1];

			if (!t.isLargestContentfulPaintSupported()) {
				return this.skip();
			}

			assert.isUndefined(b["pt.lcp.src"]);
			assert.isUndefined(b["pt.lcp.el"]);
		});
	});

});
