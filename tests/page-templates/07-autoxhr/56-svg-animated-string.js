/* eslint-env mocha */
/* global assert */

describe("e2e/07-autoxhr/56-svg-animated-string", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should get 1 beacon", function(done) {
    this.timeout(10000);

    t.ensureBeaconCount(done, 1);
  });

  it("Should not have fired an error", function(done) {
    t.ifAutoXHR(
      done,
      function() {
        assert.isUndefined(window.onerrorFired);

        done();
      },
      this.skip.bind(this));
  });
});
