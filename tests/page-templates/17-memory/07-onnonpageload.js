/* eslint-env mocha */
/* global assert */

describe("e2e/17-memory/07-onnonpageload", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent an unload beacon", function() {
    assert.isDefined(tf.beacons[1]["rt.quit"]);
  });

  it("Should have DOM count data on unload", function() {
    var b = tf.beacons[1];

    assert.isDefined(b["dom.ln"]);
    assert.isDefined(b["dom.img"]);
    assert.isDefined(b["dom.script"]);
    assert.isDefined(b["dom.iframe"]);
    assert.isDefined(b["dom.link"]);
  });
});
