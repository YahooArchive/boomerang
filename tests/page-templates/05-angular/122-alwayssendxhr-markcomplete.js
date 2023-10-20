/* eslint-env mocha */
/* global BOOMR_test */

describe("e2e/05-angular/122-alwayssendxhr-markcomplete", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  var pathName = window.location.pathname;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent nine beacons", function() {
    assert.equal(tf.beacons.length, 9);
  });

  it("Should have set the same Page ID (pid) on all beacons", function() {
    var pid = tf.beacons[0].pid;

    for (var i = 0; i < tf.beacons.length; i++) {
      var b = tf.beacons[i];

      assert.equal(b.pid, pid);
    }
  });

  it("Should have sent all beacons > 1 with rt.nstart = navigationTiming (if NavigationTiming is supported)", function() {
    if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
      for (var i = 1; i < tf.beacons.length; i++) {
        assert.equal(tf.beacons[i]["rt.nstart"], BOOMR.plugins.RT.navigationStart());
      }
    }
    else {
      this.skip();
    }
  });

  it("Should not have Boomerang timings on SPA Soft and XHR beacons", function() {
    for (var i = 1; i < tf.beacons.length; i++) {
      if (tf.beacons[i].t_other) {
        assert.equal(tf.beacons[i].t_other.indexOf("boomr_fb"), -1, "should not have boomr_fb");
        assert.equal(tf.beacons[i].t_other.indexOf("boomr_ld"), -1, "should not have boomr_ld");
        assert.equal(tf.beacons[i].t_other.indexOf("boomr_lat"), -1, "should not have boomr_lat");
        assert.equal(tf.beacons[i].t_other.indexOf("boomerang"), -1, "should not have boomerang");
      }

      // Boomerang and config timing parameters
      assert.isUndefined(tf.beacons[i]["rt.bmr"]);
      assert.isUndefined(tf.beacons[i]["rt.cnf"]);
    }
  });

  //
  // Beacon 1
  //
  describe("Beacon 1 (spa_hard)", function() {
    var i = 0;

    it("Should have sent the first beacon as http.initiator = spa_hard", function() {
      assert.equal(tf.beacons[i]["http.initiator"], "spa_hard");
    });

    it("Should have sent the first beacon for " + pathName, function() {
      var b = tf.beacons[i];

      assert.isTrue(b.u.indexOf(pathName) !== -1);
    });

    it("Should have sent the first beacon with a load time of when the completion happened (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        assert.closeTo(tf.beacons[i].t_done, window.nav1time - BOOMR.plugins.RT.navigationStart(), 100);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the first beacon without a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
        var b = tf.beacons[i];

        assert.equal(b.t_done, undefined);
        assert.equal(b["rt.start"], "none");
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the first beacon with a t_resp of the root page (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var pt = window.performance.timing;
        var b = tf.beacons[i];

        assert.equal(b.t_resp, pt.responseStart - pt.navigationStart);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the first beacon with a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var pt = window.performance.timing;
        var b = tf.beacons[i];

        assert.equal(b.t_page, b.t_done - b.t_resp);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the first beacon without rt.quit or rt.abld (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var b = tf.beacons[0];

        assert.isUndefined(b["rt.quit"]);
        assert.isUndefined(b["rt.abld"]);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the first beacon with spa.forced (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var b = tf.beacons[0];

        assert.equal(b["spa.forced"], "1");
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the first beacon with spa.waiting (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var b = tf.beacons[0];

        assert.operator(parseInt(b["spa.forced"], 10), ">=", 1);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the first beacon with resources only from its nav (if ResourceTiming is supported)", function() {
      if (t.isResourceTimingSupported()) {
        var b = tf.beacons[0];

        var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

        // should have widgets.json, home.html, app.js
        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("widgets.json") !== -1;
        }).length, 1, "Should have widgets.json");

        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("home.html") !== -1;
        }).length, 1, "Should have home.html");

        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("app.js") !== -1;
        }).length, 1, "Should have app.js");

        // shouldn't have widgets.html
        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("widget.html") !== -1;
        }).length, 0, "Should not have widgets.html");
      }
      else {
        this.skip();
      }
    });
  });

  //
  // Beacon 2
  //
  describe("Beacon 2 (xhr)", function() {
    var i = 1;

    it("Should have sent the beacon as http.initiator = xhr", function() {
      assert.equal(tf.beacons[i]["http.initiator"], "xhr");
    });
  });

  //
  // Beacon 3
  //
  describe("Beacon 3 (xhr)", function() {
    var i = 2;

    it("Should have sent the beacon as http.initiator = xhr", function() {
      assert.equal(tf.beacons[i]["http.initiator"], "xhr");
    });
  });

  //
  // Beacon 4
  //
  describe("Beacon 4 (xhr)", function() {
    var i = 3;

    it("Should have sent the beacon as http.initiator = xhr", function() {
      assert.equal(tf.beacons[i]["http.initiator"], "xhr");
    });
  });

  //
  // Beacon 5
  //
  describe("Beacon 5 (xhr)", function() {
    var i = 4;

    it("Should have sent the beacon as http.initiator = xhr", function() {
      assert.equal(tf.beacons[i]["http.initiator"], "xhr");
    });
  });

  //
  // Beacon 6
  //
  describe("Beacon 6 (spa)", function() {
    var i = 5;

    it("Should have sent the beacon for /widgets/1", function() {
      var b = tf.beacons[i];

      assert.isTrue(b.u.indexOf("/widgets/1") !== -1);
    });

    it("Should have sent the beacon with a timestamp of when the completion happened (if MutationObserver is supported)", function() {
      if (t.isMutationObserverSupported()) {
        var b = tf.beacons[i];

        assert.closeTo(b.t_done, window.nav2time - b["rt.tstart"], 100);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with a timestamp of around 1 second (if MutationObserver is not supported)", function() {
      if (!t.isMutationObserverSupported()) {
        // because of the widget IMG delaying 1 second but we couldn't track it because no MO support
        var b = tf.beacons[i];

        assert.closeTo(parseInt(b.t_done, 10), 1000, 50);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with a t_resp value (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var pt = window.performance.timing;
        var b = tf.beacons[i];

        assert.operator(parseInt(b.t_resp, 10), ">=", 0);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var pt = window.performance.timing;
        var b = tf.beacons[i];

        assert.equal(b.t_page, b.t_done - b.t_resp);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon without rt.quit and rt.abld (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var b = tf.beacons[i];

        assert.isUndefined(b["rt.quit"]);
        assert.isUndefined(b["rt.abld"]);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with spa.forced (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var b = tf.beacons[i];

        assert.equal(b["spa.forced"], "1");
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with spa.waiting (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var b = tf.beacons[i];

        assert.operator(parseInt(b["spa.forced"], 10), ">=", 1);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with resources only from its nav (if ResourceTiming is supported)", function() {
      if (t.isResourceTimingSupported()) {
        var b = tf.beacons[i];

        var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

        // should have widgets.html, widgets.json
        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("widgets.json") !== -1;
        }).length, 1, "Should have widgets.json");

        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("widget.html") !== -1;
        }).length, 1, "Shoud have widgets.html");

        // should not have home.html, app.js
        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("home.html") !== -1;
        }).length, 0, "Should not have home.html");

        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("app.js") !== -1;
        }).length, 0, "Should not have app.js");
      }
      else {
        this.skip();
      }
    });
  });

  //
  // Beacon 7
  //
  describe("Beacon 7 (xhr)", function() {
    var i = 6;

    it("Should have sent the beacon as http.initiator = xhr", function() {
      assert.equal(tf.beacons[i]["http.initiator"], "xhr");
    });

    it("Should have sent the beacon for support/widgets.json", function() {
      var b = tf.beacons[i];

      assert.isTrue(b.u.indexOf("support/widgets.json") !== -1);
    });
  });

  //
  // Beacon 8
  //
  describe("Beacon 8 (spa)", function() {
    var i = 7;

    it("Should have sent the beacon for " + pathName, function() {
      var b = tf.beacons[i];

      assert.isTrue(b.u.indexOf(pathName) !== -1);
    });

    it("Should have sent the with a timestamp of at least 3 seconds (if MutationObserver is supported)", function() {
      if (t.isMutationObserverSupported()) {
        var b = tf.beacons[i];

        assert.operator(parseInt(b.t_done, 10), ">=", 3000);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the with a timestamp of under 1 second (if MutationObserver is not supported)", function() {
      if (!t.isMutationObserverSupported()) {
        var b = tf.beacons[i];

        assert.operator(parseInt(b.t_done, 10), "<=", 1000);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with a t_resp value (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var pt = window.performance.timing;
        var b = tf.beacons[i];

        assert.operator(parseInt(b.t_resp, 10), ">=", 0);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon with a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
      if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
        var pt = window.performance.timing;
        var b = tf.beacons[i];

        assert.equal(b.t_page, b.t_done - b.t_resp);
      }
      else {
        this.skip();
      }
    });

    it("Should have sent the beacon without rt.quit or rt.abld", function() {
      var b = tf.beacons[i];

      assert.isUndefined(b["rt.quit"]);
      assert.isUndefined(b["rt.abld"]);
    });

    it("Should have sent the beacon without spa.forced", function() {
      var b = tf.beacons[i];

      assert.isUndefined(b["spa.forced"]);
    });

    it("Should have sent the beacon without spa.waiting", function() {
      var b = tf.beacons[i];

      assert.isUndefined(b["spa.waiting"]);
    });

    it("Should have sent the beacon with resources only from its nav (if ResourceTiming is supported)", function() {
      if (t.isResourceTimingSupported()) {
        var b = tf.beacons[i];

        var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

        // should have widgets.json, img.jpg
        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("widgets.json") !== -1;
        }).length, 1, "Should have widgets.json");

        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("img.jpg") !== -1;
        }).length, 1, "Should have img.jpg");

        // should not have home.html, app.js
        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("home.html") !== -1;
        }).length, 0, "Should not have home.html");

        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("app.js") !== -1;
        }).length, 0, "Should not have app.js");

        assert.equal(resources.filter(function(r) {
          return r.name.indexOf("widget.html") !== -1;
        }).length, 0, "Shoud not have widgets.html");
      }
      else {
        this.skip();
      }
    });
  });
});
