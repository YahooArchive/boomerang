/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ResourceTimingDecompression", "xhr"]);

describe("e2e/11-restiming/22-strip-basic-auth-disabled", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  function findXhr(resources) {
    for (var i = 0; i < resources.length; i++) {
      if (resources[i].name.indexOf("xhr=1") !== -1) {
        return resources[i];
      }
    }

    return undefined;
  }

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should find the xhr element with HTTP Basic Auth", function() {
    if (t.isResourceTimingSupported()) {
      var b = tf.beacons[0];

      ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
      var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
      var xhr = findXhr(resources);

      assert.isTrue(xhr.name.indexOf("//test:test@") !== -1);
    }
    else {
      this.skip();
    }
  });
});
