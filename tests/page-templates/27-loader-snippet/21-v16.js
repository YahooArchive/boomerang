/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/27-loader-snippet/21-v16", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have used the Preload Snippet method (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    assert.isTrue(t.snippetWasLoadedPreload());
  });

  it("Should have set sm=p (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    assert.equal("p", tf.lastBeacon().sm);
  });

  it("Should not have used the Preload Snippet method (if Preload is not supported)", function() {
    if (t.isPreloadSupported()) {
      return this.skip();
    }

    assert.isFalse(t.snippetWasLoadedPreload());
  });

  it("Should have set if=", function() {
    assert.isDefined("if", tf.lastBeacon()["if"]);
  });
});
