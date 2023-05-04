/* eslint-env mocha */
/* global describe,it,BOOMR,BOOMR_test,assert */

describe("e2e/00-basic/16-mo-supported", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var backupNavigator = window.navigator;
  var backupMO = window.MutationObserver;
  var UAIE11 = "Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko";

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should return true if navigator does not have userAgentData but `window` has MutationObserver. If neither is available should return false", function() {
    if (window.navigator.userAgent.match(/Trident.*rv[ :]*11\./)) {
      this.skip();
    }

    if (window.MutationObserver && !window.navigator.userAgentData) {
      assert.isTrue(BOOMR.utils.isMutationObserverSupported());
    }
    else {
      this.skip();
    }
  });

  it("Should return true if MO and UserAgentData is supported (we know it's not IE11 then)", function() {
    if (window.navigator.userAgent.match(/Trident.*rv[ :]*11\./)) {
      this.skip();
    }

    if (window.MutationObserver && window.navigator.userAgentData) {
      assert.isTrue(BOOMR.utils.isMutationObserverSupported());
    }
    else {
      this.skip();
    }
  });

  it("Should return false if MO and userAgentData is not supported", function() {
    if (!window.MutationObserver && !window.navigator.userAgentData) {
      assert.isFalse(BOOMR.utils.isMutationObserverSupported());
    }
    else {
      this.skip();
    }
  });

  it("Should return false if we are in IE11", function() {
    if (window.navigator && window.navigator.userAgent.match(/Trident.*rv[ :]*11\./)) {
      assert.isFalse(BOOMR.utils.isMutationObserverSupported());
    }
    else {
      this.skip();
    }
  });
});
