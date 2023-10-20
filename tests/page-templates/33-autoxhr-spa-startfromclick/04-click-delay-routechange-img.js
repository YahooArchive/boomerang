/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

describe("e2e/33-autoxhr-spa-startfromclick/04-click-delay-routechange-img.js", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent 2 beacons (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);

    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 2);
      },
      this.skip.bind(this));
  });

  describe("Beacon 1", function() {
    it("Should have http.initiator = spa_hard", function() {
      assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
    });
  });

  describe("Beacon 2", function() {
    it("Should have http.initiator = spa", function() {
      assert.equal(tf.beacons[1]["http.initiator"], "spa");
    });

    it("Should have URL with #newstate", function() {
      assert.include(tf.beacons[1].u, "#newstate");
    });

    it("Should have rt.tstart around the time of the route change (not the click)", function() {
      assert.closeTo(tf.beacons[1]["rt.tstart"], t.routeChangeTimes[0], 25);
    });

    it("Should have Page Load Time ~2050ms", function() {
      assert.closeTo(tf.beacons[1].t_done, t.imgTimes.img1.duration + 50, 100);
    });

    it("Should have Back End Time = 0", function() {
      assert.equal(tf.beacons[1].t_resp, 0);
    });

    it("Should have Front End Time ~2050ms", function() {
      assert.closeTo(tf.beacons[1].t_page, t.imgTimes.img1.duration + 50, 100);
    });
  });
});
