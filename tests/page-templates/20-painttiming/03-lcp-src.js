describe("e2e/20-painttiming/03-lcp-src", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have exposed LCP metric src and element (if LargestContentfulPaint is supported and happened by load)", function() {
		var observerWait, that = this;

		if (!t.isLargestContentfulPaintSupported()) {
			return this.skip();
		}

		if (typeof tf.lastBeacon()["pt.fp"] === "undefined") {
			// No paint
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["pt.lcp"], BOOMR.plugins.PaintTiming.metrics.lcp());

		assert.isString(tf.lastBeacon()["pt.lcp.src"]);
		assert.isString(tf.lastBeacon()["pt.lcp.el"]);

		assert.equal(tf.lastBeacon()["pt.lcp.src"], BOOMR.plugins.PaintTiming.metrics.lcpSrc());
		assert.equal(tf.lastBeacon()["pt.lcp.el"], BOOMR.plugins.PaintTiming.metrics.lcpEl());
	});

});
