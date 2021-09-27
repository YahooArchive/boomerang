/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/05-device-memory", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have added 'dev.mem' to the beacon", function() {
		if (!t.isSecureConnection()) {
			return this.skip();
		}

		var expected = window.navigator.deviceMemory;
		assert.equal(tf.lastBeacon()["dev.mem"], expected);
	});

});
