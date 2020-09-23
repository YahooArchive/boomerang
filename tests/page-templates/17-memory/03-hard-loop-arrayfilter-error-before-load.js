/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/03-hard-loop-arrayfilter-error-before-load", function() {
	var t = BOOMR_test;

	it("Should have sent 2 beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

});
