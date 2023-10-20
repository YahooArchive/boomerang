/* eslint-env mocha */
/* global BOOMR_test,assert */
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["14-autoxhr-before-page-load"] = function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have only sent one beacon", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 1);
  });

  it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
    if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
      t.validateBeaconWasSentAfter(0, "img.jpg", 250, 3000, 30000, true);
    }
    else {
      return this.skip();
    }
  });

  it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
    if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
      var b = tf.lastBeacon();

      assert.equal(b.t_done, undefined);
    }
    else {
      return this.skip();
    }
  });

  it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
    if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
      t.validateBeaconWasSentAfter(0, "widgets.json", 250, 0, 30000, true);
    }
    else {
      return this.skip();
    }
  });

  it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
    if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
      var b = tf.lastBeacon();

      assert.equal(b.t_done, undefined);
      assert.equal(b["rt.start"], "none");
    }
    else {
      return this.skip();
    }
  });

  it("Should have sent the http.initiator as 'spa_hard'", function() {
    var b = tf.lastBeacon();

    assert.equal(b["http.initiator"], "spa_hard");
  });
};
