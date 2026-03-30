/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ResourceTimingDecompression"]);

// wait until a beacon is sent to generate test cases
before(function(done) {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  if (!tf.beacons[0]) {
    BOOMR.subscribe("beacon", generateNow);
  }
  else {
    generateNow();
  }

  function generateNow() {
    done();

    var b = tf.beacons[0];

    // get the decoded ResourceTiming data
    ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
    var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

    describe("e2e/11-restiming/18-nexthopprotocol", function() {
      // build a test for each URL
      for (var i = 0; i < resources.length; i++) {
        (function(res) {
          it("Should have captured nextHopProtocol for " + res.name, function() {
            if (!t.isResourceTimingSupported()) {
              return this.skip();
            }

            // find this JavaScript from ResourceTiming
            var resourceTimingResource = t.findFirstResource(res.name);

            if (resourceTimingResource === null) {
              resourceTimingResource = performance.getEntriesByType("navigation")[0];
            }

            assert.isNotNull(resourceTimingResource);

            if (!resourceTimingResource.nextHopProtocol) {
              return this.skip();
            }

            if (resourceTimingResource.deliveryType === "cache") {
              // don't save for cache hits
              return this.skip();
            }

            var protocol = resourceTimingResource.nextHopProtocol.replace("http/", "h");

            assert.equal(
              protocol,
              res.nextHopProtocol,
              res.name + " should have protocol " + protocol + " but was " + res.nextHopProtocol);
          });
        }(resources[i]));
      }
    });
  }
});

