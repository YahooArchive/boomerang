/* eslint-env mocha */
/* global assert */

describe("13-xhr-before-onload-alwayssendxhr", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should get 3 beacons: 1 early, 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);
    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 3);
      },
      this.skip.bind(this));
  });

  it("Should have the fisrt beacon be an early beacon", function() {
    assert.isDefined(tf.beacons[0].early);
  });

  it("Should have the second beacon be 'navigation' (if NavigationTiming is supported)", function() {
    if (t.isNavigationTimingSupported()) {
      assert.equal(tf.beacons[1]["rt.start"], "navigation");
    }
    else {
      this.skip();
    }
  });

  it("Should have the second beacon be 'none' (if NavigationTiming is not supported)", function() {
    if (!t.isNavigationTimingSupported()) {
      assert.equal(tf.beacons[1]["rt.start"], "none");
    }
    else {
      this.skip();
    }
  });

  it("Should have the second beacon have a restiming parameter (if ResourceTiming is supported)", function() {
    if (t.isResourceTimingSupported()) {
      assert.isDefined(tf.beacons[1].restiming);
    }
    else {
      this.skip();
    }
  });

  it("Should have the second beacon have a rt.bmr parameter (if ResourceTiming is supported)", function() {
    if (t.isResourceTimingSupported()) {
      assert.isDefined(tf.beacons[1]["rt.bmr"]);
    }
    else {
      this.skip();
    }
  });

  it("Should have the second beacon have a t_other parameter", function() {
    assert.isDefined(tf.beacons[1].t_other);

    assert.include(tf.beacons[1].t_other, "boomerang");

    if (t.isNavigationTimingSupported()) {
      // these timers are never started, when we check to add them to beacon,
      // because they don't have `start` on them, we check `cached_t_start` - which won't
      // have a value becaus there's no nav timing
      assert.include(tf.beacons[1].t_other, "boomr_fb");
      assert.include(tf.beacons[1].t_other, "boomr_ld");
      assert.include(tf.beacons[1].t_other, "boomr_lat");
    }
    else {
      this.skip();
    }
  });

  it("Should have the third beacon be an XHR", function() {
    assert.equal(tf.beacons[2]["http.initiator"], "xhr");
  });

  it("Should have the third beacon be missing the rt.bmr parameter", function() {
    assert.isUndefined(tf.beacons[2]["rt.bmr"]);
  });

  it("Should have the third beacon be missing the t_other parameter", function() {
    assert.isUndefined(tf.beacons[2].t_other);
  });
});
