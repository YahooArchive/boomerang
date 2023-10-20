/* eslint-env mocha */
/* global BOOMR_test,assert */
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["05-route-change-hashtags"] = function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent three beacons", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 3);
  });

  it("Should have sent the first beacon as http.initiator = spa_hard", function() {
    assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
  });

  it("Should have sent all subsequent beacons as http.initiator = spa", function() {
    for (var i = 1; i < 2; i++) {
      assert.equal(tf.beacons[i]["http.initiator"], "spa");
    }
  });

  it("Should have sent all subsequent beacons have rt.nstart = navigationTiming (if NavigationTiming is supported)", function() {
    if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
      for (var i = 1; i < 2; i++) {
        assert.equal(tf.beacons[i]["rt.nstart"], BOOMR.plugins.RT.navigationStart());
      }
    }
    else {
      return this.skip();
    }
  });

  //
  // Beacon 1
  //
  it("Should have sent the first beacon for 05-route-change-hashtags.html", function() {
    var b = tf.beacons[0];

    assert.isTrue(b.u.indexOf("05-route-change-hashtags.html") !== -1);
  });

  it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
    if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
      t.validateBeaconWasSentAfter(0, "img.jpg&id=home", 500, 3000, 30000, 0);
    }
    else {
      return this.skip();
    }
  });

  it("Should take as long as the longest img load (if MutationObserver is supported but NavigationTiming is not)", function() {
    if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
      var b = tf.beacons[0];

      assert.equal(b.t_done, undefined);
    }
    else {
      return this.skip();
    }
  });

  it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
    if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
      t.validateBeaconWasSentAfter(0, "widgets.json", 500, 0, 30000, false);
    }
    else {
      return this.skip();
    }
  });

  it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
    if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
      var b = tf.beacons[0];

      assert.equal(b.t_done, undefined);
      assert.equal(b["rt.start"], "none");
    }
    else {
      return this.skip();
    }
  });

  //
  // Beacon 2
  //
  it("Should have sent the second beacon for /widgets/1", function() {
    var b = tf.beacons[1];

    assert.isTrue(b.u.indexOf("#/widgets/1") !== -1 ||
                  b.u.indexOf("#widgets/1") !== -1);
  });

  it("Should have sent the second beacon with a timestamp of at least 1 second (if MutationObserver is supported)", function() {
    if (t.isMutationObserverSupported()) {
      // because of the widget IMG delaying 1 second
      var b = tf.beacons[1];

      assert.operator(b.t_done, ">=", 1000);
    }
    else {
      return this.skip();
    }
  });

  it("Should have sent the second beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
    if (!t.isMutationObserverSupported()) {
      // because of the widget IMG delaying 1 second but we couldn't track it because no MO support
      var b = tf.beacons[1];

      assert.operator(b.t_done, ">=", 0);
    }
    else {
      return this.skip();
    }
  });

  //
  // Beacon 3
  //
  it("Should have sent the third beacon for /05-route-change.html", function() {
    var b = tf.beacons[2];

    assert.isTrue(b.u.indexOf("05-route-change-hashtags.html#") !== -1 ||
                  b.u.indexOf("05-route-change-hashtags.html#/") !== -1);
  });

  it("Should have sent the third with a timestamp of at least 3 seconds (if MutationObserver is supported)", function() {
    if (t.isMutationObserverSupported()) {
      var b = tf.beacons[2];

      assert.operator(b.t_done, ">=", 3000);
    }
    else {
      return this.skip();
    }
  });

  it("Should have sent the third with a timestamp of under 1 second (if MutationObserver is not supported)", function() {
    if (!t.isMutationObserverSupported()) {
      var b = tf.beacons[2];

      assert.operator(b.t_done, "<=", 1000);
    }
    else {
      return this.skip();
    }
  });
};
