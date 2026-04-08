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

    // add any additions
    var contentTypeAdditions = b["restiming.ct"];
    var startIdx = parseInt(contentTypeAdditions[0], 36);

    for (var newIdx = 1; newIdx < contentTypeAdditions.length; newIdx++) {
      ResourceTimingDecompression.REV_CONTENT_TYPES[startIdx + newIdx - 1] = contentTypeAdditions[newIdx];
    }

    var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

    describe("e2e/11-restiming/19-content-type", function() {
      // build a test for each URL
      for (var i = 0; i < resources.length; i++) {
        (function(res) {
          it("Should have captured contentType for " + res.name, function() {
            if (!t.isResourceTimingSupported()) {
              return this.skip();
            }

            // find this JavaScript from ResourceTiming
            var resourceTimingResource = t.findFirstResource(res.name);

            if (resourceTimingResource === null) {
              resourceTimingResource = performance.getEntriesByType("navigation")[0];
            }

            assert.isNotNull(resourceTimingResource);

            if (!resourceTimingResource.contentType) {
              return this.skip();
            }

            var contentType = resourceTimingResource.contentType;

            assert.equal(
              contentType,
              res.contentType,
              res.name + " should have contentType " + contentType + " but was " + res.contentType);
          });
        }(resources[i]));
      }
    });
  }
});

