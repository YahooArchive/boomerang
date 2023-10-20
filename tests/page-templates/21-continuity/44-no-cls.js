/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/21-continuity/44-no-cls", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should not have set c.cls", function() {
    assert.isUndefined(tf.lastBeacon()["c.cls"]);
  });

  it("Should not have set c.cls.topid", function() {
    assert.isUndefined(tf.lastBeacon()["c.cls.topid"]);
  });

  it("Should not have set c.cls.d", function() {
    assert.isUndefined(tf.lastBeacon()["c.cls.d"]);
  });
});
