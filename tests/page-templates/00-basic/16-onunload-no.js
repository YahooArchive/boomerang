/*eslint-env mocha*/
/*global assert*/

describe("e2e/00-basic/16-onunload-no", function() {
	var beaconData;

	it("Should not have sent an unload beacon", function(done) {
		var successTimeout;

		this.timeout(10000);

		var unloadBeaconHandler = function(data) {
			clearTimeout(successTimeout);

			// need to avoid BOOMR event callback wrappers
			setTimeout(function() {
				assert.fail("Unload beacon sent!");
			}, 0);
		};

		var testFrame = document.getElementById("boomer_test_frame");
		testFrame.contentWindow.BOOMR.subscribe("beacon", unloadBeaconHandler, null, this);
		testFrame.src = "about:blank";

		// if a beacon doesn't fire in 2 seconds, we're done
		successTimeout = setTimeout(done, 2000);
	});
});
