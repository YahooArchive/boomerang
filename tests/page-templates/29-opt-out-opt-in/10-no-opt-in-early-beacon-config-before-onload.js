/* eslint-env mocha */
/* global BOOMR_test */

describe("e2e/29-opt-out-opt-in/10-no-opt-in-config-before-onload", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("Should not have sent beacon", function() {
    assert.equal(tf.beaconCount(), 0);
  });
});
