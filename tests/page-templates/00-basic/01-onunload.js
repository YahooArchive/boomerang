/* eslint-env mocha */
/* global assert */

describe("e2e/00-basic/01-onunload", function() {
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

  it("Should have run all unload plugins for the unload beacon", function() {
    assert.equal(beaconData.onunloadtest, 1);
  });
});
