/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/17-ua-plt-baseline", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have a value for ua.plt", function() {
    assert.isString(tf.lastBeacon()["ua.plt"], "ua.plt");
  });
});
