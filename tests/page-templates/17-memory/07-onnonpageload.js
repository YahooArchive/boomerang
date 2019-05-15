/*eslint-env mocha*/
/*global assert*/

describe("e2e/17-memory/07-onnonpageload", function() {
	var beaconData;

	it("Should have sent an unload beacon", function(done) {
		var unloadBeaconHandler = function(data) {
			beaconData = data;
			assert.isString(beaconData["rt.quit"]);
			done();
		};

		var testFrame = document.getElementById("boomer_test_frame");
		testFrame.contentWindow.BOOMR.subscribe("beacon", unloadBeaconHandler, null, this);
		testFrame.src = "about:blank";
	});

	it("Should have DOM count data on unload", function() {
		assert.isDefined(beaconData["dom.ln"]);
		assert.isDefined(beaconData["dom.img"]);
		assert.isDefined(beaconData["dom.script"]);
		assert.isDefined(beaconData["dom.iframe"]);
		assert.isDefined(beaconData["dom.link"]);
	});
});
