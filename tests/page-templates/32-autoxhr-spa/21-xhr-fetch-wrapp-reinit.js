/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

describe("e2e/32-autoxhr-spa/21-xhr-fetch-wrapp-reinit.js", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent 2 beacons (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);

    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 2);
      },
      this.skip.bind(this));
  });

  it("Should have called the XHR proxy function once", function() {
    assert.equal(window.XMLHttpRequest_called, 1);
  });

  it("Should have finished the XHR proxy function callback", function() {
    assert.isTrue(window.XMLHttpRequest_called_complete);
  });
});
