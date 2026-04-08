/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_script_delay", "BOOMR_loader_timeout"]);

describe("e2e/27-loader-snippet/22-preloader-mode-delayed-from-head", function() {
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

  it("Should have set sm=if (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    assert.equal("if", tf.lastBeacon().sm);
  });

  it("Should not have used the Preload Snippet method (if Preload is not supported)", function() {
    if (t.isPreloadSupported()) {
      return this.skip();
    }

    assert.isFalse(t.snippetWasLoadedPreload());
  });

  it("Should have added LINK rel 'preload' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var link = t.findBoomerangLoaderLinkPreload();

    assert.equal("preload", link.rel);
  });

  it("Should have added LINK as 'script' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var link = t.findBoomerangLoaderLinkPreload();

    assert.equal("script", link.as);
  });

  it("Should have added LINK to the same block (HEAD) as the loader snippet (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var link = t.findBoomerangLoaderLinkPreload();

    assert.equal("HEAD", link.parentNode.tagName);
  });

  it("Should not have added SCRIPT id 'boomr-scr-as' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    assert.isNull(t.findBoomerangLoaderScriptPreload());
  });

  it("Should have added a IFRAME with src 'about:blank' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.equal("about:blank", iframe.src);
  });

  it("Should have added a IFRAME to the BODY (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.equal("BODY", iframe.parentNode.tagName);
    assert.equal(document.body, iframe.parentNode);
  });

  it("Should have added a IFRAME with title '' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.strictEqual(iframe.title, "");
  });

  it("Should have added a IFRAME with role 'presentation' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.equal("presentation", iframe.role);
  });

  it("Should have added a IFRAME with width 0 (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.equal(0, iframe.width);
  });

  it("Should have added a IFRAME with height 0 (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.equal(0, iframe.height);
  });

  it("Should have added a IFRAME with border '0px' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.include("0px", iframe.style.border);
  });

  it("Should have added a IFRAME with display 'none' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.equal("none", iframe.style.display);
  });

  it("Should have added a IFRAME with id 'boomr-if' (if Preload is supported)", function() {
    if (!t.isPreloadSupported()) {
      return this.skip();
    }

    var iframe = t.findBoomerangLoaderFrame();

    assert.equal("boomr-if", iframe.id);
  });
});
