/**
 * Plugin to collect memory, page construction (DOM), screen, CPU and battery metrics (when available).
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * * Resources:
 *   * `dom.res`: Number of resources fetched in the main frame (via ResourceTiming)
 *   * `dom.doms`: Number of unique domains in the main page (via ResourceTiming)
 * * Memory
 *   * `mem.total`: [`memory.totalJSHeapSize`](https://webplatform.github.io/docs/apis/timing/properties/memory/)
 *   * `mem.limit`: [`memory.jsHeapSizeLimit`](https://webplatform.github.io/docs/apis/timing/properties/memory/)
 *   * `mem.used`: [`memory.usedJSHeapSize`](https://webplatform.github.io/docs/apis/timing/properties/memory/)
 *   * `mem.lssz`: Number of localStorage bytes used
 *   * `mem.lsln`: Number of localStorage keys used
 *   * `mem.sssz`: Number of sessionStorage bytes used
 *   * `mem.ssln`: Number of sessionStorage keys used
 *   * `dev.mem`: Device memory
 * * Screen
 *   * `scr.xy`: [`screen.width`](https://developer.mozilla.org/en-US/docs/Web/API/Screen/width)
 *     and [`screen.height`](https://developer.mozilla.org/en-US/docs/Web/API/Screen/height) (e.g. `100x200`)
 *   * `scr.bpp`: [`screen.colorDepth`](https://developer.mozilla.org/en-US/docs/Web/API/Screen/colorDepth)
 *     and [`screen.pixelDepth`](https://developer.mozilla.org/en-US/docs/Web/API/Screen/pixelDepth) (e.g. `32/24`)
 *   * `scr.dpx`: [`screen.devicePixelRatio`](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)
 *   * `scr.orn`: [`screen.orientation.angle`](https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation) and
 *     [`screen.orientation.type`](https://developer.mozilla.org/en-US/docs/Web/API/Screen/type)
 *     (e.g. `90/landscape-primary`)
 *   * `scr.sxy`: [`window.scrollX`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX) and
 *     [`window.scrollY`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY) (e.g. `0x1000`)
 * * Hardware
 *   * `scr.mtp`:
 *     [`navigator.maxTouchPoints`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/maxTouchPoints)
 *   * `cpu.cnc`:
 *     [`navigator.hardwareConcurrency`]
 *     (https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency)
 * * DOM
 *   * `dom.ln`: Number of DOM nodes in the main frame
 *   * `dom.sz`: Number of HTML bytes of of the main frame
 *   * `dom.ck`: Number of bytes stored as cookies available to JavaScript on the current domain
 *   * `dom.img`: Number of `IMG` nodes in the main frame
 *   * `dom.img.ext`: Number of external (e.g. not `data:` URI) `IMG` nodes in the main frame
 *   * `dom.img.uniq`: Number of unique `IMG src` nodes in the main frame
 *   * `dom.script`: Number of `SCRIPT` nodes in the main frame
 *   * `dom.script.ext`: Number of external (e.g. not inline or `data:` URI) `SCRIPT` nodes in the main frame
 *   * `dom.script.uniq`: Number of unique `SCRIPT src` nodes in the main frame
 *   * `dom.iframe`: Number of `IFRAME` nodes in the main frame
 *   * `dom.iframe.ext`: Number of external (e.g. not `javascript:` or `about:` URI) `IFRAME` nodes in the main frame
 *   * `dom.iframe.uniq`: Number of unique `IFRAME src` nodes in the main frame
 *   * `dom.link`: Number of `LINK` nodes in the main frame
 *   * `dom.link.css`: Number of `rel="stylesheet"` `LINK` nodes in the main frame
 *   * `dom.link.css.uniq`: Number of unique `rel="stylesheet"` `LINK` nodes in the main frame
 * * Net
 *   * `net.sd`: Boolean stating whether the user has data saver turned on or not
 *
 * @class BOOMR.plugins.Memory
 */
(function() {
  var w,
      p = {},
      d, m, s, n, b, ls, ss, impl;

  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  if (BOOMR.plugins.Memory) {
    return;
  }

  /**
   * This flag protects us from a hard loop/blocking the browser
   * when we get an exception when calling BOOMR.utils.arrayFilter()
   * from the Memory plugin and we send an error beacon after onload.
   *
   * Why we get a hard loop?
   *
   * When we send an error beacon then Boomerang will call
   * the done() function from the Memory plugin. If at some line
   * in the done() function we get an error then an error beacon will
   * be sent again and we will fall in to a hard loop.
   *
   */
  var hasTriggeredArrayFilterError = false;

  /**
   * Count elements of a given type and return the count or an object with the
   * `key` mapped to the `count` if a `key` is specified. If one or more filters
   * are included, apply them incrementally to the `element` array, assigning
   * each intermediate count to the corresponding `key` in the return object
   *
   * @param {string} type Element type to search DOM for
   * @param {string[]} [keys] List of keys for return object.
   * If not included, just the tag count is returned.
   *
   * If included then an object is returned with each element in this array as
   * a key, and the element count as the value.
   *
   * For keys[1] onwards, the element count is the number of elements returned
   * from each corresponding filter function.
   * @param {function} [filter] List of filters to apply incrementally to element array.
   * This is NOT an array.
   *
   * The input to each function in the argument list is the array returned by the previous function
   *
   * The first function receives the array returned by the `getElementsByTagName` function
   *
   * Each function MUST return a NodeList or an Array with a `length` property
   *
   * @returns {number|object}
   * If only one argument is passed in, returns a nodeCount matching that element type.
   * If multiple arguments are passed in, returns an object with key to count
   * mapping based on the rules above.
   */
  function nodeCount(type, keys) {
    var tags, r, o, i, filter;

    try {
      tags = d.getElementsByTagName(type);
      r = tags.length;

      if (keys && keys.length) {
        o = {};
        o[keys[0]] = r;

        // Iterate through all remaining arguments checking for filters
        // Remember that keys.length will be at least 1 and arguments.length will be at least 2
        // so the first key we use is keys[1] for arguments[2]
        for (i = 2; r > 0 && i < arguments.length && i - 1 < keys.length; i++) {
          filter = arguments[i];

          if (typeof filter !== "function") {
            continue;
          }

          try {
            tags = BOOMR.utils.arrayFilter(tags, filter);
            // Only add this if different from the previous

            if (tags.length !== r) {
              r = tags.length;
              o[keys[i - 1]] = r;
            }
          }
          catch (err) {
            if (!hasTriggeredArrayFilterError) {
              hasTriggeredArrayFilterError = true;
              BOOMR.addError(err, "Memory.nodeList." + type + ".filter[" + (i - 2) + "]");
            }
          }
        }
      }

      return o || r;
    }
    catch (err) {
      BOOMR.addError(err, "Memory.nodeList." + type);

      return 0;
    }
  }

  /**
   * Wraps a callback for error reporting
   *
   * @param {boolean} condition Condition
   * @param {function} callback Callback
   * @param {string} component Component name
   */
  function errorWrap(condition, callback, component) {
    if (condition) {
      try {
        callback();
      }
      catch (err) {
        BOOMR.addError(err, "Memory.done." + component);
      }
    }
  }

  // A private object to encapsulate all your implementation details
  impl = {
    onNonPageLoad: false,

    done: function(data) {
      if (!w) {
        // this can happen for an unload beacon
        return;
      }

      if (!impl.onNonPageLoad && !BOOMR.isPageLoadBeacon(data)) {
        return;
      }

      // If we have resource timing, get number of resources
      errorWrap(true,
        function() {
          var res,
              doms = {},
              a;

          if (!p || typeof p.getEntriesByType !== "function") {
            return;
          }

          res = p.getEntriesByType("resource");

          if (!res || !res.length) {
            return;
          }

          BOOMR.addVar("dom.res", res.length, true);

          a = BOOMR.window.document.createElement("a");

          [].forEach.call(res, function(r) {
            a.href = r.name;
            doms[a.hostname] = true;
          });

          BOOMR.addVar("dom.doms", Object.keys(doms).length, true);
        },
        "resources"
      );

      if (m) {
        BOOMR.addVar({
          "mem.total": m.totalJSHeapSize,
          "mem.limit": m.jsHeapSizeLimit,
          "mem.used": m.usedJSHeapSize
        }, true);
      }

      errorWrap(ls && ss,
        function() {
          BOOMR.addVar({
            "mem.lsln": ls.length,
            "mem.ssln": ss.length
          }, true);

          if (window.JSON && typeof JSON.stringify === "function") {
            BOOMR.addVar({
              "mem.lssz": JSON.stringify(ls).length,
              "mem.sssz": JSON.stringify(ss).length
            }, true);
          }
        },
        "localStorage"
      );

      errorWrap(s,
        function() {
          var sx, sy;

          BOOMR.addVar({
            "scr.xy": s.width + "x" + s.height,
            "scr.bpp": s.colorDepth + "/" + (s.pixelDepth || "")
          }, true);

          if (s.orientation) {
            BOOMR.addVar("scr.orn", s.orientation.angle + "/" + s.orientation.type, true);
          }

          if (w.devicePixelRatio > 1) {
            BOOMR.addVar("scr.dpx", w.devicePixelRatio, true);
          }

          var scroll = BOOMR.utils.scroll();

          if (scroll.x || scroll.y) {
            BOOMR.addVar("scr.sxy", scroll.x + "x" + scroll.y, true);
          }
        },
        "screen"
      );

      errorWrap(n,
        function() {
          if (n.hardwareConcurrency) {
            BOOMR.addVar("cpu.cnc", n.hardwareConcurrency, true);
          }

          if (n.maxTouchPoints) {
            BOOMR.addVar("scr.mtp", n.maxTouchPoints, true);
          }

          if (n.connection && n.connection.hasOwnProperty("saveData")) {
            BOOMR.addVar("net.sd", n.connection.saveData ? 1 : 0, true);
          }

          if (typeof n.deviceMemory !== "undefined") {
            BOOMR.addVar("dev.mem", n.deviceMemory, true);
          }
        },
        "navigator"
      );

      errorWrap(true,
        function() {
          var uniqUrls;

          BOOMR.addVar({
            "dom.ln": nodeCount("*"),
            "dom.sz": d.documentElement.innerHTML.length,
            "dom.ck": d.cookie.length
          }, true);

          uniqUrls = {};
          BOOMR.addVar(nodeCount(
            "img",
            ["dom.img", "dom.img.ext", "dom.img.uniq"],
            function(el) {
              return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|data:|#)/);
            },
            function(el) {
              return !(uniqUrls[el.currentSrc || el.src] = uniqUrls.hasOwnProperty(el.currentSrc || el.src));
            }
          ), true);

          uniqUrls = {};
          BOOMR.addVar(nodeCount(
            "script",
            ["dom.script", "dom.script.ext", "dom.script.uniq"],
            function(el) {
              return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|#)/);
            },
            function(el) {
              return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
            }
          ), true);

          uniqUrls = {};
          BOOMR.addVar(nodeCount(
            "iframe",
            ["dom.iframe", "dom.iframe.ext", "dom.iframe.uniq"],
            function(el) {
              return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|#)/);
            },
            function(el) {
              return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
            }
          ), true);

          uniqUrls = {};
          BOOMR.addVar(nodeCount(
            "link",
            ["dom.link", "dom.link.css", "dom.link.css.uniq"],
            function(link) {
              return link.rel && link.rel.toLowerCase() === "stylesheet" &&
                link.href && !link.href.toLowerCase().match(/^(?:about:|javascript:|#)/);
            },
            function(link) {
              return !(uniqUrls[link.href] = uniqUrls.hasOwnProperty(link.href));
            }
          ), true);
        },
        "dom"
      );
    }
  };

  //
  // Exports
  //
  BOOMR.plugins.Memory = {
    /**
     * Initializes the plugin.
     *
     * @memberof BOOMR.plugins.Memory
     */
    init: function(config) {
      var c;

      try {
        w = BOOMR.window;
        d = w.document;
        p = BOOMR.getPerformance();
        c = w.console;
        s = w.screen;
        n = w.navigator;

        // gather config and config overrides
        BOOMR.utils.pluginConfig(impl, config, "Memory",
          ["onNonPageLoad"]);

        try {
          ls = w.localStorage;
          ss = w.sessionStorage;
        }
        catch (e) {
          // NOP - some browsers will throw on access to var
        }
      }
      catch (err) {
        BOOMR.addError(err, "Memory.init");
      }

      m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

      if (impl.initialized) {
        return this;
      }

      impl.initialized = true;

      // we do this before sending a beacon to get the snapshot when the beacon is sent
      BOOMR.subscribe("before_beacon", impl.done, null, impl);

      return this;
    },

    /**
     * This plugin is always complete (ready to send a beacon)
     *
     * @returns {boolean} `true`
     * @memberof BOOMR.plugins.Memory
     */
    is_complete: function() {
      // Always true since we run on before_beacon, which happens after the check
      return true;
    }
  };
}());
