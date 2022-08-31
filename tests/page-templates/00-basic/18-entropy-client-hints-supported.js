/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/18-entropy-client-hints-supported", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have set properties architecture, model, and platformVersion if client hints supported", function(done) {
		if (!t.isClientHintsSupported()) {
			return this.skip();
		}

		navigator.userAgentData.getHighEntropyValues(["architecture", "model", "platformVersion"]).then(function(ua) {
			var arch = tf.lastBeacon()["ua.arch"];
			assert.isString(arch);
			assert.equal(arch, ua.architecture);

			var model = tf.lastBeacon()["ua.model"];
			assert.isString(model);
			assert.equal(model, ua.model);

			var pltv = tf.lastBeacon()["ua.pltv"];
			assert.isString(pltv);
			assert.equal(pltv, ua.platformVersion);

			done();
		});
	});

	it("Should NOT have set properties architecture, model, and platformVersion if client hints not supported", function() {
		if (t.isClientHintsSupported()) {
			return this.skip();
		}

		assert.isUndefined(tf.lastBeacon()["ua.arch"]);
		assert.isUndefined(tf.lastBeacon()["ua.model"]);
		assert.isUndefined(tf.lastBeacon()["ua.pltv"]);
	});
});
