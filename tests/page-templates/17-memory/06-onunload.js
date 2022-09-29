/*eslint-env mocha*/
/*global assert*/

describe("e2e/17-memory/06-onunload", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  var UNLOAD_MEMORY_PARAMS = [
    "cpu.cnc",
    "dom.ck",
    "dom.doms",
    "dom.iframe",
    "dom.img",
    "dom.link",
    "dom.ln",
    "dom.res",
    "dom.script.ext",
    "dom.script",
    "dom.sz",
    "mem.limit",
    "mem.lsln",
    "mem.lssz",
    "mem.ssln",
    "mem.sssz",
    "mem.total",
    "mem.used",
    "scr.bpp",
    "scr.dpx",
    "scr.orn",
    "scr.xy "
  ];

  it("Should have sent an unload beacon", function() {
    assert.isDefined(tf.beacons[1]["rt.quit"]);
  });

  it("Should not have Memory data on the Unload beacon", function() {
    for (var i = 0; i < UNLOAD_MEMORY_PARAMS.length; i++) {
      assert.isUndefined(tf.beacons[1][UNLOAD_MEMORY_PARAMS[i]],
        UNLOAD_MEMORY_PARAMS[i] + " should not be on the beacon");
    }
  });
});
