/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/27-loader-snippet/08-v02", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set sm=i", function() {
    assert.equal("i", tf.lastBeacon().sm);
  });

  it("Should have set if=", function() {
    assert.isDefined("if", tf.lastBeacon()["if"]);
  });
});
