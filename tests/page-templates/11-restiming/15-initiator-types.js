/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/15-initiator-types", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have a restiming parameter on the beacon (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			assert.isDefined(b.restiming);
		}
		else {
			this.skip();
		}
	});

	it("Should decompress all known resource's initiatorTypes correctly", function() {
		if (!t.isResourceTimingSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
		var entries = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

		var types = [
			["boomerang-test-framework", "script"],
			["id=audio-src", "audio"],
			["id=video-src", "video"],
			["id=video-track", "track"],
			["id=video-track", "track"],
			["15-initiator-types.html", "navigation"],
			["15-initiator-types.js", "script"],
			["id=img", "img"],
			["id=input", "input"],
			["id=video-poster", "video"],
			["id=object", "object"],
			["mocha.css", "link"],
			["mocha.js", "script"],
			["assertive-chai.js", "script"],
			["lodash.js", "script"],
			["resourcetiming-decompression.js", "script"],
			["common.js", "script"]
		];

		BOOMR.utils.forEach(types, function(type) {
			var entry = entries.find(function(e) {
				return e.name.indexOf(type[0]) > -1;
			});

			// skip ones that don't exist
			if (!entry) {
				return;
			}

			assert.isTrue(BOOMR.utils.inArray(entry.initiatorType, [type[1], "other"]),
				type[0] + " is " + type[1] + ", was " + entry.initiatorType);
		});
	});
});
