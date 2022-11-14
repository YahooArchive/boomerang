/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/29-opt-out-opt-in/19-spa-opt-out-before-page-ready", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-out] Should have set BOOMR_CONSENT=\"opted-out\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-out\"") !== -1);
  });

  it("[Opt-out before Boomerang loaded] Should not have BOOMR_CONSENT=\"opted-in\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-in\"") === -1);
  });

  it("[After Opt-out] Should have sent exactly 0 beacons because Opt-out before Boomerang was loaded.", function() {
    assert.equal(tf.beaconCount(), 0);
  });
});
