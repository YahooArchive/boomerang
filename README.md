**boomerang always comes back, except when it hits something.**

# Summary

[![Join the chat at https://gitter.im/SOASTA/boomerang](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/SOASTA/boomerang)

boomerang is a JavaScript library that measures the page load time experienced by
real users, commonly called RUM (Real User Measurement).  It has the ability to
send this data back to your server for further analysis.  With boomerang, you
find out exactly how fast your users think your site is.

Apart from page load time, boomerang measures performance timings, metrics and
characteristics of your user's web browsing experience.  All you have to do is
include it in your web pages and call the `BOOMR.init()` method.  Once the
performance data is captured, it will be beaconed to your chosen URL.

boomerang is designed to be a performant and flexible library that can be adapted
to your site's needs.  It has an extensive plugin architecture, and works with
both traditional and modern websites (including Single Page Apps).

boomerang's goal is to not affect the load time of the page (avoiding the
[Observer Effect](https://en.wikipedia.org/wiki/Observer_effect_(information_technology))).
It can be loaded in an asynchronous way that will not delay the page load even
if `boomerang.js` is unavailable.

# Features

* Supports:
  * IE 6+, Edge, all major versions of Firefox, Chrome, Opera, and Safari
  * Desktop and mobile devices
* Captures (all optional):
  * Page characteristics such as the URL and Referrer
  * Overall page load times (via [NavigationTiming](https://www.w3.org/TR/navigation-timing/) if available)
  * DNS, TCP, Request and Response timings (via [NavigationTiming](https://www.w3.org/TR/navigation-timing/))
  * Browser characteristics such as screen size, orientation, memory usage, visibility state
  * DOM characteristics such as the number of nodes, HTML length, number of images, scripts, etc
  * [ResourceTiming](https://www.w3.org/TR/resource-timing-1/) data (to reconstruct the page's Waterfall)
  * Bandwidth
  * Mobile connection data
  * DNS latency
  * JavaScript Errors
  * XMLHttpRequest instrumentation
  * Third-Party analytics providers IDs
  * Single Page App interactions

# Usage

boomerang can be included on your page in one of two ways: [synchronously](#synchronously) or [asynchronously](#asynchronously).

The asynchronous method is recommended.

<a name="synchronously"></a>

## The simple synchronous way

```html
<script src="boomerang.js"></script>
<script src="plugins/rt.js"></script>
<!-- any other plugins you want to include -->
<script>
  BOOMR.init({
    beacon_url: "http://yoursite.com/beacon/"
  });
</script>
```

**Note:** You must include at least one plugin (it doesn't have to be `RT`) or
else the beacon will never fire.

Each plugin has its own configuration as well -- these configuration options
should be included in the `BOOMR.init()` call:

```javascript
BOOMR.init({
  beacon_url: "http://yoursite.com/beacon/",
  ResourceTiming: {
    enabled: true,
    clearOnBeacon: true
  }
});
```

<a name="asynchronously"></a>

## The faster, more involved, asynchronous way

Loading boomerang asynchronously ensures that even if `boomerang.js` is
unavailable (or loads slowly), your host page will not be affected.

### 1. Add a plugin to init your code

Create a plugin (or use the sample `zzz-last-plugin.js`) with a call
to `BOOMR.init`:

```javascript
BOOMR.init({
  config: parameters,
  ...
});
BOOMR.t_end = new Date().getTime();
```

You could also include any other code you need.  For example, you could include
a timer to measure when boomerang has finished loading (as above).

### 2. Build boomerang

The [build process](#documentation) bundles `boomerang.js` and all of the plugins
listed in `plugins.json` (in that order).

To build boomerang with all of your desired plugins, you would run:

```bash
grunt clean build
```

This creates a deployable boomerang in the `build` directory, e.g. `build/boomerang-<version>.min.js`.

Install this file on your web server or origin server where your CDN can pick it
up.  Set a far future
[max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
header for it.  This file will never change.

### 3. Asynchronously include the script on your page

There are two methods of asynchronously including boomerang on your page: by
adding it to your main document, or via the IFRAME/Preload method.

The former method could block your `onload` event (affecting the measured
performance of your page), so the later method is recommended.

<a name="asynchronously-document"></a>

#### 3.1. Adding it to the main document

Include the following code at the _top_ of your HTML document:

```javascript
<script>
(function(d, s) {
  var js = d.createElement(s),
      sc = d.getElementsByTagName(s)[0];

  js.src="http://your-cdn.host.com/path/to/boomerang-<version>.js";
  sc.parentNode.insertBefore(js, sc);
}(document, "script"));
</script>
```

Best practices will suggest including all scripts at the bottom of your page.
However, that only applies to scripts that block downloading of other resources.

Including a script this way will not block other resources, however it _will_
block `onload`.

Including the script at the top of your page gives it a good chance of loading
before the rest of your page does, thereby reducing the probability of it
blocking the `onload` event.

If you don't want to block `onload` either, use the following IFRAME/Preload method:

<a name="asynchronously-iframe"></a>

#### 3.2. Adding it via an IFRAME/Preload

The method described in 3.1 will still block `onload` on most browsers.

To avoid blocking `onload`, we can load boomerang in an asynchronous IFRAME or via LINK preload (for browsers that support
it). The general process is documented on in
[this blog post](https://calendar.perfplanet.com/2018/a-csp-compliant-non-blocking-script-loader/).

For boomerang, the asynchronous loader snippet you'll use is:

```javascript
<script>
(function() {
  // Boomerang Loader Snippet version 15
  if (window.BOOMR && (window.BOOMR.version || window.BOOMR.snippetExecuted)) {
    return;
  }

  window.BOOMR = window.BOOMR || {};
  window.BOOMR.snippetStart = new Date().getTime();
  window.BOOMR.snippetExecuted = true;
  window.BOOMR.snippetVersion = 15;

  // NOTE: Set Boomerang URL here
  window.BOOMR.url = "";

  // document.currentScript is supported in all browsers other than IE
  var where = document.currentScript || document.getElementsByTagName("script")[0],
      // Parent element of the script we inject
      parentNode = where.parentNode,
      // Whether or not Preload method has worked
      promoted = false,
      // How long to wait for Preload to work before falling back to iframe method
      LOADER_TIMEOUT = 3000;

  // Tells the browser to execute the Preloaded script by adding it to the DOM
  function promote() {
    if (promoted) {
      return;
    }

    var script = document.createElement("script");

    script.id = "boomr-scr-as";
    script.src = window.BOOMR.url;

    // Not really needed since dynamic scripts are async by default and the script is already in cache at this point,
    // but some naive parsers will see a missing async attribute and think we're not async
    script.async = true;

    parentNode.appendChild(script);

    promoted = true;
  }

  // Non-blocking iframe loader (fallback for non-Preload scenarios) for all recent browsers.
  // For IE 6/7/8, falls back to dynamic script node.
  function iframeLoader(wasFallback) {
    promoted = true;

    var dom,
        doc = document,
        bootstrap, iframe, iframeStyle,
        win = window;

    window.BOOMR.snippetMethod = wasFallback ? "if" : "i";

    // Adds Boomerang within the iframe
    bootstrap = function(parent, scriptId) {
      var script = doc.createElement("script");

      script.id = scriptId || "boomr-if-as";
      script.src = window.BOOMR.url;

      BOOMR_lstart = new Date().getTime();

      parent = parent || doc.body;
      parent.appendChild(script);
    };

    // For IE 6/7/8, we'll just load the script in the current frame:
    // * IE 6/7 don't support 'about:blank' for an iframe src (it triggers warnings on secure sites)
    // * IE 8 required a doc write call for it to work, which is bad practice
    // This means loading on IE 6/7/8 may cause SPoF.
    if (!window.addEventListener && window.attachEvent && navigator.userAgent.match(/MSIE [678]\./)) {
      window.BOOMR.snippetMethod = "s";

      bootstrap(parentNode, "boomr-async");

      return;
    }

    // The rest of this function is for browsers that don't support Preload hints but will work with CSP & iframes
    iframe = document.createElement("IFRAME");

    // An empty frame
    iframe.src = "about:blank";

    // We set title and role appropriately to play nicely with screen readers and other assistive technologies
    iframe.title = "";
    iframe.role = "presentation";

    // Ensure we're not loaded lazily
    iframe.loading = "eager";

    // Hide the iframe
    iframeStyle = (iframe.frameElement || iframe).style;
    iframeStyle.width = 0;
    iframeStyle.height = 0;
    iframeStyle.border = 0;
    iframeStyle.display = "none";

    // Append to the end of the current block
    parentNode.appendChild(iframe);

    // Try to get the iframe's document object
    try {
      win = iframe.contentWindow;
      doc = win.document.open();
    }
    catch (e) {
      // document.domain has been changed and we're on an old version of IE, so we got an access denied.
      // Note: the only browsers that have this problem also do not have CSP support.

      // Get document.domain of the parent window
      dom = document.domain;

      // Set the src of the iframe to a JavaScript URL that will immediately set its document.domain
      // to match the parent.
      // This lets us access the iframe document long enough to inject our script.
      // Our script may need to do more domain massaging later.
      iframe.src = "javascript:var d=document.open();d.domain='" + dom + "';void 0;";
      win = iframe.contentWindow;

      doc = win.document.open();
    }

    // document.domain hasn't changed, regular method should be OK
    win._boomrl = function() {
      bootstrap();
    };

    if (win.addEventListener) {
      win.addEventListener("load", win._boomrl, false);
    }
    else if (win.attachEvent) {
      win.attachEvent("onload", win._boomrl);
    }

    // Finish the document
    doc.close();
  }

  // See if Preload is supported or not
  var link = document.createElement("link");

  if (link.relList &&
      typeof link.relList.supports === "function" &&
      link.relList.supports("preload") &&
      ("as" in link)) {
    window.BOOMR.snippetMethod = "p";

    // Set attributes to trigger a Preload
    link.href = window.BOOMR.url;
    link.rel  = "preload";
    link.as   = "script";

    // Add our script tag if successful, fallback to iframe if not
    link.addEventListener("load", promote);
    link.addEventListener("error", function() {
      iframeLoader(true);
    });

    // Have a fallback in case Preload does nothing or is slow
    setTimeout(function() {
      if (!promoted) {
        iframeLoader(true);
      }
    }, LOADER_TIMEOUT);

    // Note the timestamp we started trying to Preload
    BOOMR_lstart = new Date().getTime();

    // Append our link tag
    parentNode.appendChild(link);
  }
  else {
    // No Preload support, use iframe loader
    iframeLoader(false);
  }

  // Save when the onload event happened, in case this is a non-NavigationTiming browser
  function boomerangSaveLoadTime(e) {
    window.BOOMR_onload = (e && e.timeStamp) || new Date().getTime();
  }

  if (window.addEventListener) {
    window.addEventListener("load", boomerangSaveLoadTime, false);
  }
  else if (window.attachEvent) {
    window.attachEvent("onload", boomerangSaveLoadTime);
  }
})();
</script>
```

Minified:

```javascript
<script>(function(){if(window.BOOMR&&(window.BOOMR.version||window.BOOMR.snippetExecuted)){return}window.BOOMR=window.BOOMR||{};window.BOOMR.snippetStart=(new Date).getTime();window.BOOMR.snippetExecuted=true;window.BOOMR.snippetVersion=15;window.BOOMR.url="";var e=document.currentScript||document.getElementsByTagName("script")[0],a=e.parentNode,s=false,t=3e3;function n(){if(s){return}var e=document.createElement("script");e.id="boomr-scr-as";e.src=window.BOOMR.url;e.async=true;a.appendChild(e);s=true}function i(e){s=true;var t,i=document,n,o,d,r=window;window.BOOMR.snippetMethod=e?"if":"i";n=function(e,t){var n=i.createElement("script");n.id=t||"boomr-if-as";n.src=window.BOOMR.url;BOOMR_lstart=(new Date).getTime();e=e||i.body;e.appendChild(n)};if(!window.addEventListener&&window.attachEvent&&navigator.userAgent.match(/MSIE [678]\./)){window.BOOMR.snippetMethod="s";n(a,"boomr-async");return}o=document.createElement("IFRAME");o.src="about:blank";o.title="";o.role="presentation";o.loading="eager";d=(o.frameElement||o).style;d.width=0;d.height=0;d.border=0;d.display="none";a.appendChild(o);try{r=o.contentWindow;i=r.document.open()}catch(e){t=document.domain;o.src="javascript:var d=document.open();d.domain='"+t+"';void 0;";r=o.contentWindow;i=r.document.open()}r._boomrl=function(){n()};if(r.addEventListener){r.addEventListener("load",r._boomrl,false)}else if(r.attachEvent){r.attachEvent("onload",r._boomrl)}i.close()}var o=document.createElement("link");if(o.relList&&typeof o.relList.supports==="function"&&o.relList.supports("preload")&&"as"in o){window.BOOMR.snippetMethod="p";o.href=window.BOOMR.url;o.rel="preload";o.as="script";o.addEventListener("load",n);o.addEventListener("error",function(){i(true)});setTimeout(function(){if(!s){i(true)}},t);BOOMR_lstart=(new Date).getTime();a.appendChild(o)}else{i(false)}function d(e){window.BOOMR_onload=e&&e.timeStamp||(new Date).getTime()}if(window.addEventListener){window.addEventListener("load",d,false)}else if(window.attachEvent){window.attachEvent("onload",d)}})();</script>
```

Change the `boomerangUrl` to the location of Boomerang on your server.

The `id` of the script node created by this code MUST be `boomr-if-as` (for IFRAME mode) or `boomr-scr-as` (for
Preload mode) as boomerang looks for those ids to determine if it's running within an IFRAME and to determine the
URL of the script.

boomerang will still export the `BOOMR` object to the parent window if running
inside an IFRAME, so the rest of your code should remain unchanged.

#### 3.3. Identifying when boomerang has loaded

If you load boomerang asynchronously, there's some uncertainty in when boomerang
has completed loading.  To get around this, you can subscribe to the
`onBoomerangLoaded` Custom Event on the `document` object:

```javascript
// Modern browsers
if (document.addEventListener) {
  document.addEventListener("onBoomerangLoaded", function(e) {
    // e.detail.BOOMR is a reference to the BOOMR global object
  });
}
// IE 6, 7, 8 we use onPropertyChange and look for propertyName === "onBoomerangLoaded"
else if (document.attachEvent) {
  document.attachEvent("onpropertychange", function(e) {
    if (!e) e=event;
    if (e.propertyName === "onBoomerangLoaded") {
      // e.detail.BOOMR is a reference to the BOOMR global object
    }
  });
}
```

Note that this only works on browsers that support the CustomEvent interface,
which is Chrome (including Android), Firefox 6+ (including Android), Opera
(including Android, but not Opera Mini), Safari (including iOS), IE 6+
(but see the code above for the special way to listen for the event on IE6, 7 & 8).

boomerang also fires the `onBeforeBoomerangBeacon` and `onBoomerangBeacon`
events just before and during beaconing.

<a name="installation"></a>

# Installation

There are several ways of including Boomerang in your project:

1. Boomerang can be downloaded from the official [Boomerang Github repository](https://github.com/akamai/boomerang).

2. NPM: `npm install boomerangjs`

3. Bower: `bower install boomerang`

Once fetched, see [Building Boomerang](https://akamai.github.io/boomerang/tutorial-building.html)
for more details on how to include the plugins you require.

<a name="documentation"></a>

# Documentation

Documentation is in the `docs/` directory.  Boomerang documentation is
written in Markdown and is built via [JSDoc](http://usejsdoc.org/).

You can build the current documentation by running Grunt:

```bash
grunt jsdoc
```

HTML files will be built under `build/docs`.

Open-source Boomerang Documentation is currently published at
[akamai.github.io/boomerang/](https://akamai.github.io/boomerang/).

The team at Akamai works on mPulse Boomerang, which contains a few mPulse-specific plugins and may have additional
changes being tested before being backported to the open-source Boomerang.  mPulse Boomerang usage documentation is
available at [docs.soasta.com/boomerang/](https://docs.soasta.com/boomerang/) and mPulse Boomerang API documentation
is at [developer.akamai.com/tools/boomerang/docs/](https://developer.akamai.com/tools/boomerang/docs/).

Additional documentation:

* [API Documentation](https://akamai.github.io/boomerang/): The `BOOMR` API
* [Building Boomerang](https://akamai.github.io/boomerang/tutorial-building.html): How to build boomerang with plugins
* [Contributing](https://akamai.github.io/boomerang/tutorial-contributing.html): Contributing to the open-source project
* [Creating Plugins](https://akamai.github.io/boomerang/tutorial-creating-plugins.html): Creating a plugin
* [Methodology](https://akamai.github.io/boomerang/tutorial-methodology.html): How boomerang works internally
* [How-Tos](https://akamai.github.io/boomerang/tutorial-howtos.html): Short recipes on how to do a bunch of things with boomerang

# Source code

The boomerang source code is primarily on GitHub at [github.com/akamai/boomerang](https://github.com/akamai/boomerang).

Feel free to fork it and [contribute](https://akamai.github.io/boomerang/tutorial-contributing.html) to it.

You can also get a [check out the releases](https://github.com/akamai/boomerang/releases)
or download a [tarball](https://github.com/akamai/boomerang/archive/master.tar.gz) or
[zip](http://github.com/akamai/boomerang/archive/master.zip) of the code.

# Support

We use [GitHub Issues](https://github.com/akamai/boomerang/issues) for discussions,
feature requests and bug reports.

Get in touch at [github.com/akamai/boomerang/issues](https://github.com/akamai/boomerang/issues).

boomerang is supported by the developers at [Akamai](http://akamai.com/), and the
awesome community of open-source developers that use and hack it.  That's you.  Thank you!

# Contributions

Boomerang is brought to you by:

* the former [Exceptional Performance](http://developer.yahoo.com/performance/) team at the company once known as
    [Yahoo!](http://www.yahoo.com/), aided by the [Yahoo! Developer Network](http://developer.yahoo.com/),
* the folks at [LogNormal](http://www.lognormal.com/), continued by
* the mPulse team at [SOASTA](https://www.soasta.com/), ongoing by
* the mPulse team at [Akamai](https://www.akamai.com/), and
* many independent contributors whose contributions are cemented in our git history

To help out, please read our [contributing](https://akamai.github.io/boomerang/tutorial-contributing.html) page.

# Copyright

* _Copyright (c) 2011, Yahoo! Inc.  All rights reserved._
* _Copyright (c) 2011-2012, Log-Normal Inc.  All rights reserved._
* _Copyright (c) 2012-2017 SOASTA, Inc. All rights reserved._
* _Copyright (c) 2017-2023, Akamai Technologies, Inc. All rights reserved._
* _Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms._
