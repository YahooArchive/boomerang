/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/21-continuity/07-click", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent the click count (c.c) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.c"]);
    assert.equal(parseInt(b["c.c"], 10), 10);
  });

  it("Should have sent the rage click count (c.c.r) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.c.r"]);
    assert.equal(parseInt(b["c.c.r"], 10), 2);
  });

  it("Should have sent the log (c.l) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.l"]);
  });

  it("Should have logged the correct events (c.l) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    var clickLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
      // LOG_TYPE_CLICK === 1
      return obj.type === 1;
    });

    assert.equal(clickLogs.length, 10);

    for (var i = 0; i < clickLogs.length; i++) {
      // should all be x,y === 100 or 200
      var x = parseInt(clickLogs[i].x, 36);
      var y = parseInt(clickLogs[i].y, 36);

      assert.isTrue(x === 100 || x === 200);
      assert.isTrue(y === 100 || y === 200);
    }
  });

  it("Should have the click timeline (c.t.click) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.t.click"]);
    assert.operator(b["c.t.click"].length, ">=", 1);
  });

  it("Should have the interaction timeline (c.t.inter) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.t.inter"]);
    assert.operator(b["c.t.inter"].length, ">=", 1);
  });

  it("Should have the Time to First Interaction (c.ttfi) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.ttfi"]);
    assert.operator(parseInt(b["c.ttfi"], 10), ">=", 1);
    assert.equal(parseFloat(b["c.ttfi"]), parseInt(b["c.ttfi"], 10));
  });

  it("Should have First Input Delay (c.fid) (if creating Mouse Events is supported)", function() {
    if (window.cannotCreateMouseEvent) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.fid"]);
    assert.operator(parseInt(b["c.fid"], 10), ">=", 0);
  });
});
