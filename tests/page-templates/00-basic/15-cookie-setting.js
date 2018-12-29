/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/15-cookie-setting", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have only read the cookie twice during init", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			2,
			t.findBoomerangMarksBetween(
				"get_raw_cookie",
				t.findBoomerangMarks("init:start")[0],
				t.findBoomerangMarks("init:end")[0]
			).length);
	});

	it("Should have only set the cookie once during init", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			1,
			t.findBoomerangMarksBetween(
				"set_cookie_real",
				t.findBoomerangMarks("init:start")[0],
				t.findBoomerangMarks("init:end")[0]
			).length);
	});

	it("Should not have read the cookie during config init", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			0,
			t.findBoomerangMarksBetween(
				"get_raw_cookie",
				t.findBoomerangMarks("init:start")[1],
				t.findBoomerangMarks("init:end")[1]
			).length);
	});

	it("Should have only set the cookie once during config init", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			1,
			t.findBoomerangMarksBetween(
				"set_cookie_real",
				t.findBoomerangMarks("init:start")[1],
				t.findBoomerangMarks("init:end")[1]
			).length);
	});

	it("Should not have read the cookie during load", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			0,
			t.findBoomerangMarksBetween(
				"get_raw_cookie",
				t.findBoomerangMarks("fire_event:page_ready:start")[0],
				t.findBoomerangMarks("fire_event:page_ready:end")[0]
			).length);
	});

	it("Should have only set the cookie once during load", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			1,
			t.findBoomerangMarksBetween(
				"set_cookie_real",
				t.findBoomerangMarks("fire_event:page_ready:start")[0],
				t.findBoomerangMarks("fire_event:page_ready:end")[0]
			).length);
	});

	it("Should not have read the cookie during sendBeacon", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			0,
			t.findBoomerangMarksBetween(
				"get_raw_cookie",
				t.findBoomerangMarks("send_beacon:start")[0],
				t.findBoomerangMarks("send_beacon:end")[0]
			).length);
	});

	it("Should not have set cookie during sendBeacon", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			0,
			t.findBoomerangMarksBetween(
				"set_cookie_real",
				t.findBoomerangMarks("send_beacon:start")[0],
				t.findBoomerangMarks("send_beacon:end")[0]
			).length);
	});

	it("Should not have read the cookie once during unload", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			0,
			t.findBoomerangMarksBetween(
				"get_raw_cookie",
				t.findBoomerangMarks("fire_event:page_unload:start")[0],
				t.findBoomerangMarks("fire_event:page_unload:end")[0]
			).length);
	});

	it("Should have only set the cookie once during unload", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			1,
			t.findBoomerangMarksBetween(
				"set_cookie_real",
				t.findBoomerangMarks("fire_event:page_unload:start")[0],
				t.findBoomerangMarks("fire_event:page_unload:end")[0]
			).length);
	});

	it("Should have only read the cookie 2 times total", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			2,
			t.findBoomerangMarks("get_raw_cookie").length);
	});

	it("Should have only set the cookie 4 times total", function() {
		// We use UserTiming to measure marks
		if (!t.isUserTimingSupported()) {
			return this.skip();
		}

		assert.equal(
			4,
			t.findBoomerangMarks("set_cookie_real").length);
	});
});
