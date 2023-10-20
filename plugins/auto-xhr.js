/**
 * Instrument and measure `XMLHttpRequest` (AJAX) requests.
 *
 * With this plugin, sites can measure the performance of `XMLHttpRequests`
 * (XHRs) and other in-page interactions after the page has been loaded.
 *
 * This plugin also monitors DOM manipulations following a XHR to filter out
 * "background" XHRs.
 *
 * This plugin provides the backbone for the {@link BOOMR.plugins.SPA} plugin.  Single Page App navigations
 * use XHR and DOM monitoring to determine when the SPA navigations are complete.
 *
 * This plugin has a corresponding {@tutorial header-snippets} that helps monitor XHRs prior to Boomerang loading.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## What is Measured
 *
 * When `AutoXHR` is enabled, this plugin will monitor several events:
 *
 * - `XMLHttpRequest` requests
 * - `Fetch` API requests
 * - Clicks
 * - `window.History` changes indirectly through SPA plugins (History, Angular, etc.)
 *
 * When any of these events occur, `AutoXHR` will start monitoring the page for
 * other events, DOM manipulations and other networking activity.
 *
 * As long as the event isn't determined to be background activity (i.e an XHR
 * that didn't change the DOM at all), the event will be measured until all networking
 * activity has completed.
 *
 * This means if your click generated an XHR that triggered an updated view to fetch
 * more HTML that added images to the page, the entire event will be measured
 * from the click to the last image completing.
 *
 * ## Usage
 *
 * To enable AutoXHR, you should set {@link BOOMR.plugins.AutoXHR.init|instrument_xhr} to `true`:
 *
 * ```
 * BOOMR.init({
 *     instrument_xhr: true
 * });
 * ```
 *
 * Once enabled and initialized, the `window.XMLHttpRequest` object will be
 * replaced with a "proxy" object that instruments all XHRs.
 *
 * ## Monitoring XHRs
 *
 * After `AutoXHR` is enabled, any `XMLHttpRequest.send` will be monitored:
 *
 * ```
 * xhr = new XMLHttpRequest();
 * xhr.open("GET", "/api/foo");
 * xhr.send(null);
 * ```
 *
 * If this XHR triggers DOM changes, a beacon will eventually be sent.
 *
 * This beacon will have `http.initiator=xhr` and the beacon parameters will differ
 * from a Page Load beacon.  See {@link BOOMR.plugins.RT} and
 * {@link BOOMR.plugins.NavigationTiming} for details.
 *
 * ## Combining XHR Beacons
 *
 * By default `AutoXHR` groups all XHR activity that happens in the same event together.
 *
 * If you have one XHR that immediately triggers a second XHR, you will get a single
 * XHR beacon.  The `u` (URL) will be of the first XHR.
 *
 * If you don't want this behavior, and want to measure *every* XHR on the page, you
 * can enable {@link BOOMR.plugins.AutoXHR.init|alwaysSendXhr=true}.  When set, every
 * distinct XHR will get its own XHR beacon.
 *
 * ```
 * BOOMR.init({
 *     AutoXHR: {
 *         alwaysSendXhr: true
 *     }
 * });
 * ```
 *
 * {@link BOOMR.plugins.AutoXHR.init|alwaysSendXhr} can also be a list of strings
 * (matching URLs), regular expressions (matching URLs), or a function which returns
 * true for URLs to always send XHRs for.
 *
 * ```
 * BOOMR.init({
 *     AutoXHR: {
 *         alwaysSendXhr: [
 *             "http://domain.com/url/to/match",
 *             /regexmatch/,
 *         ]
 *    }
 * });
 *
 * // or
 *
 * BOOMR.init({
 *     AutoXHR: {
 *         alwaysSendXhr: function(url) {
 *             return url.indexOf("domain.com") !== -1;
 *         }
 *    }
 * });
 * ```
 *
 *
 * ### Compatibility and Browser Support
 *
 * Currently supported Browsers and platforms that AutoXHR will work on:
 *
 * - IE 9+ (not in quirks mode)
 * - Chrome 38+
 * - Firefox 25+
 *
 * In general we support all browsers that support
 * [MutationObserver]{@link https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver}
 * and [XMLHttpRequest]{@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest}.
 *
 * We will not use MutationObserver in IE 11 due to several browser bugs.
 * See {@link BOOMR.utils.isMutationObserverSupported} for details.
 *
 * ## Excluding Certain Requests or DOM Elements From Instrumentation
 *
 * Whenever Boomerang intercepts an `XMLHttpRequest` (or Fetch), it will check if that request
 * matches anything in the XHR exclude list. If it does, Boomerang will not
 * instrument, time, send a beacon for that request, or include it in the
 * {@link BOOMR.plugins.SPA} calculations.
 *
 * There are two methods of excluding XHRs: Defining the `BOOMR.xhr_excludes` array,
 * or using the {@link BOOMR.plugins.AutoXHR.init|excludeFilters} option.
 *
 * The `BOOMR.xhr_excludes` XHR excludes list is defined by creating a map, and
 * adding URL parts that you would like to exclude from instrumentation. You
 * can put any of the following in `BOOMR.xhr_excludes`:
 *
 * 1. A full HREF
 * 2. A hostname
 * 3. A path
 *
 * Example:
 *
 * ```
 * BOOMR = window.BOOMR || {};
 *
 * BOOMR.xhr_excludes = {
 *   "www.mydomain.com":  true,
 *   "a.anotherdomain.net": true,
 *   "/api/v1/foobar":  true,
 *   "https://mydomain.com/dashboard/": true
 * };
 * ```
 *
 * The {@link BOOMR.plugins.AutoXHR.init|excludeFilters} gives you more control by allowing you
 * to specify one or more callbacks that will be run for each XHR/Fetch.  If any callback
 * returns `true`, the XHR/Fetch will *not* be instrumented.
 *
 * ```
 * BOOMR.init({
 *   AutoXHR: {
 *     excludeFilters: [
 *       function(anchor) {
 *         return anchor.href.match(/non-trackable/);
 *       }
 *     ]
 *   }
 * });
 * ```
 *
 * Finally, the {@link BOOMR.plugins.AutoXHR.init|domExcludeFilters} DOM filters can be used to filter out
 * specific DOM elements from being tracked (marked as "uninteresting").
 *
 * ```
 * BOOMR.init({
 *   AutoXHR: {
 *     domExcludeFilters: [
 *       function(elem) {
 *         return elem.id === "ignore";
 *       }
 *     ]
 *   }
 * });
 * ```
 *
 * ## Beacon Parameters
 *
 * XHR beacons have different parameters in general than Page Load beacons.
 *
 * - Many of the timestamps will differ, see {@link BOOMR.plugins.RT}
 * - All of the `nt_*` parameters are ResourceTiming, see {@link BOOMR.plugins.NavigationTiming}
 * - `u`: the URL of the resource that was fetched
 * - `pgu`: The URL of the page the resource was fetched on
 * - `http.initiator`: `xhr` for both XHR and Fetch requests
 *
 * ## Interesting Nodes
 *
 * A `MutationObserver` is used to detect "interesting" nodes. Interesting nodes are
 * new IMG/IMAGE/IFRAME/LINK (rel=stylesheet) nodes or existing nodes that are
 * changing their source URL.
 *
 * We consider the following "uninteresting" nodes:
 *   - Nodes that have either a width or height <= 1px.
 *   - Nodes with either a width or height of 0px.
 *   - Nodes that have display:none.
 *   - Nodes that have visibility:hidden.
 *   - Nodes with an opacity:0.
 *   - Nodes that update their source URL to the same value.
 *   - Nodes that have a blank source URL.
 *   - Images with a loading="lazy" attribute
 *   - Nodes that have a source URL starting with `about:`, `javascript:` or `data:`.
 *   - SCRIPT nodes because there is no consistent way to detect when they have loaded.
 *   - Existing IFRAME nodes that are changing their source URL because is no consistent
 *     way to detect when they have loaded.
 *   - Nodes that have a source URL that matches a AutoXHR exclude filter rule.
 *   - Nodes that have been manually excluded
 *
 * ## Algorithm
 *
 * Here's how the general AutoXHR algorithm works:
 *
 * - `0.0` SPA hard route change (page navigation)
 *
 *   - Monitor for XHR resource requests and interesting Mutation resource requests
 *     for 1s or at least until page onload. We extend our 1s timeout after all
 *     interesting resource requests have completed.
 *
 * - `0.1` SPA soft route change from a synchronous call (eg. History changes as a
 *         result of a pushState or replaceState call)
 *
 *   - In this case we get the new URL when the developer calls pushState or
 *     replaceState.
 *   - We create a pending event with the start time and the new URL.
 *   - We do not know if they plan to make an XHR call or use a dynamic script
 *     node, or do nothing interesting (eg: just make a div visible/invisible).
 *   - We also do not know if they will do this before or after they've called
 *     pushState/replaceState.
 *   - Our best bet is to monitor if either a XHR resource requests or interesting
 *     Mutation resource requests will happen in the next 1s.
 *   - When interesting resources are detected, we wait until they complete.
 *   - We restart our 1s timeout after all interesting resources have completed.
  *  - If something uninteresting happens, we set the timeout for 1 second if
 *     it wasn't already started.
 *       - We'll only do this once per event since we don't want to continuously
 *         extend the timeout with each uninteresting event.
 *   - If nothing happens during the additional timeout, we stop watching and fire the
 *     event. The event end time will be end time of the last tracked resource.
 *   - If nothing interesting was detected during the first timeout and the URL has not
 *     changed then we drop the event.
 *
 * - `0.2` SPA soft route change from an asynchronous call (eg. History changes as a
 *         result of the user hitting Back/Forward and we get a window.popstate event)
 *
 *   - In this case we get the new URL from location.href when our event listener
 *     runs.
 *   - We do not know if this event change will result in some interesting network
 *     activity or not.
 *   - We do not know if the developer's event listener has already run before
 *     ours or if it will run in the future or even if they do have an event listener.
 *   - Our best bet is the same as 0.1 above.
 *
 * - `0.3` SPA soft route change from a click that triggers a XHR before the state is
 *    changed (when {@link BOOMR.plugins.AutoXHR.init|spaStartFromClick} is enabled).
 *
 *   - We store the time of the click
 *   - If any additional XHRs come next, we track those
 *   - When a pushState comes after the XHRs (before the timeout), we will "migrate" the
 *     click to a SPA event
 *
 * - `1` Click initiated (Only available when no SPA plugins are enabled)
 *
 *   - User clicks on something.
 *   - We create a pending event with the start time and no URL.
 *   - We turn on DOM observer, and wait up to 50 milliseconds for activity.
 *     - If nothing happens during the first timeout, we stop watching and clear the
 *       event without firing it.
 *     - Else if something uninteresting happens, we set the timeout for 1s
 *       if it wasn't already started.
 *       - We'll only do this once per event since we don't want to continuously
 *         extend the timeout with each uninteresting event.
 *     - Else if an interesting node is added, we add load and error listeners
 *       and turn off the timeout but keep watching.
 *       - Once all listeners have fired, we start waiting again up to 50ms for activity.
 *     - If nothing happens during the additional timeout, we stop watching and fire the event.
 *
 * - `2` XHR/Fetch initiated
 *
 *   - XHR or Fetch request is sent.
 *   - We create a pending event with the start time and the request URL.
 *   - We watch for all changes in XHR state (for async requests) and for load (for
 *     all requests).
 *   - We turn on DOM observer at XHR Onload or when the Fetch Promise resolves.
 *     We then wait up to 50 milliseconds for activity.
 *     - If nothing happens during the first timeout, we stop watching and clear the
 *       event without firing it.
 *     - If something uninteresting happens, we set the timeout for 1 second if
 *       it wasn't already started.
 *       - We'll only do this once per event since we don't want to continuously
 *         extend the timeout with each uninteresting event.
 *     - Else if an interesting node is added, we add load and error listeners
 *       and turn off the timeout.
 *       - Once all listeners have fired, we start waiting again up to 50ms for activity.
 *     - If nothing happens during the additional timeout, we stop watching and fire the event.
 *
 * What about overlap?
 *
 * - `3.1` XHR/Fetch initiated while a click event is pending
 *
 *   - If first click watcher has not detected anything interesting or does not
 *     have a URL, abort it
 *   - If the click watcher has detected something interesting and has a URL, then
 *     - Proceed with 2 above.
 *     - Concurrently, click stops watching for new resources
 *       - Once all resources click is waiting for have completed then fire the event.
 *
 * - `3.2` Click initiated while XHR/Fetch event is pending
 *
 *   - Ignore click
 *
 * - `3.3` Click initiated while a click event is pending
 *
 *   - If first click watcher has not detected anything interesting or does not
 *     have a URL, abort it.
 *   - Else proceed with parallel event steps from 3.1 above.
 *
 * - `3.4` XHR/Fetch initiated while an XHR/Fetch event is pending
 *
 *   - Add the second XHR/Fetch as an interesting resource to be tracked by the
 *     XHR pending event in progress.
 *
 * - `3.5` XHR/Fetch initiated while SPA event is pending
 *
 *   - Add the second XHR/Fetch as an interesting resource to be tracked by the
 *     XHR pending event in progress.
 *
 * - `3.6` SPA event initiated while an XHR event is pending
 *     - Proceed with 0 above.
 *     - Concurrently, XHR event stops watching for new resources. Once all resources
 *       the XHR event is waiting for have completed, fire the event.
 *
 * - `3.7` SPA event initiated while a SPA event is pending
 *     - If the pending SPA event had detected something interesting then send an aborted
 *       SPA beacon. If not, drop the pending event.
 *     - Proceed with 0 above.
 *
 * @class BOOMR.plugins.AutoXHR
 */
(function() {
  var w, d, handler, a, impl,
      readyStateMap = ["uninitialized", "open", "responseStart", "domInteractive", "responseEnd"];

  /**
   * Single Page Applications get an additional timeout for all XHR Requests to settle in.
   * This is used after collecting resources for a SPA routechange.
   * Default is 1000ms, overridable with spaIdleTimeout
   * @type {number}
   * @constant
   * @default
   */
  var SPA_TIMEOUT = 1000;

  /**
   * @constant
   * @desc
   * For early beacons.
   * Single Page Applications get an additional timeout after the resource requests in
   * flight reaches 0 for the first time.
   * We want to allow some time for the SPA to fill in any custom dimensions that we
   * capture on the early beacon.
   * @type {number}
   * @default
   */
  var SPA_EARLY_TIMEOUT = 100;

  /**
   * Clicks and XHR events get 50ms for an interesting thing to happen before
   * being cancelled.
   * Default is 50ms, overridable with xhrIdleTimeout
   * @type {number}
   * @constant
   * @default
   */
  var CLICK_XHR_TIMEOUT = 50;

  /**
   * Fetch events that don't read the body of the response get an extra wait time before
   * we look for it's corresponding ResourceTiming entry.
   * Default is 200ms, overridable with fetchBodyUsedWait
   * @type {number}
   * @constant
   * @default
   */
  var FETCH_BODY_USED_WAIT_DEFAULT = 200;

  /**
   * If we get a Mutation event that doesn't have any interesting nodes after
   * a Click or XHR event started, wait up to 1,000ms for an interesting one
   * to happen before cancelling the event.
   * @type {number}
   * @constant
   * @default
   */
  var UNINTERESTING_MUTATION_TIMEOUT = 1000;

  /**
   * How long to wait if we're not ready to send a beacon to try again.
   * @constant
   * @type {number}
   * @default
   */
  var READY_TO_SEND_WAIT = 500;

  /**
   * Timeout event fired for XMLHttpRequest resource
   * @constant
   * @type {number}
   * @default
   */
  var XHR_STATUS_TIMEOUT        = -1001;

  /**
   * XMLHttpRequest was aborted
   * @constant
   * @type {number}
   * @default
   */
  var XHR_STATUS_ABORT          = -999;

  /**
   * An error occured fetching XMLHttpRequest/Fetch resource
   * @constant
   * @type {number}
   * @default
   */
  var XHR_STATUS_ERROR          = -998;

  /**
   * An exception occured as we tried to request resource
   * @constant
   * @type {number}
   * @default
   */
  var XHR_STATUS_OPEN_EXCEPTION = -997;

  /**
   * Default resources to count as Back-End during a SPA nav
   * @constant
   * @type {string[]}
   */
  var SPA_RESOURCES_BACK_END = ["xmlhttprequest", "script", "fetch"];

  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  if (BOOMR.plugins.AutoXHR) {
    return;
  }

  w = BOOMR.window;

  // If this browser cannot support XHR, we'll just skip this plugin which will
  // save us some execution time.

  // XHR not supported or XHR so old that it doesn't support addEventListener
  // (IE 6, 7, 8, as well as newer running in quirks mode.)
  if (!w || !w.XMLHttpRequest || !(new w.XMLHttpRequest()).addEventListener) {
    // Nothing to instrument
    return;
  }

  /* BEGIN_DEBUG */
  function debugLog(msg) {
    BOOMR.debug(msg, "AutoXHR");
  }
  /* END_DEBUG */

  /**
   * Tries to resolve `href` links from relative URLs.
   *
   * This implementation takes into account a bug in the way IE handles relative
   * paths on anchors and resolves this by assigning `a.href` to itself which
   * triggers the URL resolution in IE and will fix missing leading slashes if
   * necessary.
   *
   * @param {string} anchor The anchor object to resolve
   *
   * @returns {string} The unrelativized URL href
   * @memberof BOOMR.plugins.AutoXHR
   */
  function getPathName(anchor) {
    if (!anchor) {
      return null;
    }

    /*
     correct relativism in IE
     anchor.href = "./path/file";
     anchor.pathname == "./path/file"; //should be "/path/file"
     */
    anchor.href = anchor.href;

    /*
     correct missing leading slash in IE
     anchor.href = "path/file";
     anchor.pathname === "path/file"; //should be "/path/file"
     */
    var pathName = anchor.pathname;

    if (pathName.charAt(0) !== "/") {
      pathName = "/" + pathName;
    }

    return pathName;
  }

  /**
   * Based on the contents of BOOMR.xhr_excludes check if the URL that we instrumented as XHR request
   * matches any of the URLs we are supposed to not send a beacon about.
   *
   * @param {HTMLAnchorElement} anchor HTML anchor element with URL of the element
   * checked against `BOOMR.xhr_excludes`
   *
   * @returns {boolean} `true` if intended to be excluded, `false` if it is not in the list of excludables
   * @memberof BOOMR.plugins.AutoXHR
   */
  function shouldExcludeXhr(anchor) {
    var urlIdx;

    if (anchor.href) {
      if (anchor.href.match(/^(about:|javascript:|data:)/i)) {
        return true;
      }

      // don't track our own beacons (allow for protocol-relative URLs)
      if (typeof BOOMR.getBeaconURL === "function" && BOOMR.getBeaconURL()) {
        urlIdx = anchor.href.indexOf(BOOMR.getBeaconURL());

        if (urlIdx === 0 || urlIdx === 5 || urlIdx === 6) {
          return true;
        }
      }
    }

    return BOOMR.xhr_excludes.hasOwnProperty(anchor.href) ||
      BOOMR.xhr_excludes.hasOwnProperty(anchor.hostname) ||
      BOOMR.xhr_excludes.hasOwnProperty(getPathName(anchor));
  }

  /**
   * Handles the MutationObserver for {@link BOOMR.plugins.AutoXHR}.
   *
   * @class MutationHandler
   */
  function MutationHandler() {
    this.watch = 0;
    this.timer = null;
    this.timerEarlyBeacon = null;

    this.pending_events = [];
    this.lastSpaLocation = null;
  }

  /**
   * Disable internal MutationObserver instance. Use this when uninstrumenting the site we're on.
   *
   * @method
   * @memberof MutationHandler
   * @static
   */
  MutationHandler.stop = function() {
    MutationHandler.pause();
    MutationHandler.observer = null;
  };

  /**
   * Pauses the MutationObserver.  Call [resume]{@link handler#resume} to start it back up.
   *
   * @method
   * @memberof MutationHandler
   * @static
   */
  MutationHandler.pause = function() {
    if (MutationHandler.observer &&
        MutationHandler.observer.observer &&
        !MutationHandler.isPaused) {
      MutationHandler.isPaused = true;
      MutationHandler.observer.observer.disconnect();
    }
  };

  /**
   * Resumes the MutationObserver after a [pause]{@link handler#pause}.
   *
   * @method
   * @memberof MutationHandler
   * @static
   */
  MutationHandler.resume = function() {
    if (MutationHandler.observer &&
        MutationHandler.observer.observer &&
        MutationHandler.isPaused) {
      MutationHandler.isPaused = false;
      MutationHandler.observer.observer.observe(d, MutationHandler.observer.config);
    }
  };

  /**
   * Initiate {@link MutationHandler.observer} on the
   * [outer parent document]{@link BOOMR.window.document}.
   *
   * Uses [addObserver]{@link BOOMR.utils.addObserver} to instrument.
   *
   * [Our internal handler]{@link handler#mutation_cb} will be called if
   * something happens.
   *
   * @method
   * @memberof MutationHandler
   * @static
   */
  MutationHandler.start = function() {
    if (MutationHandler.observer) {
      // don't start twice
      return;
    }

    var config = {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ["src", "href"]
    };

    /* eslint-disable no-inline-comments */
    // Add a perpetual observer
    MutationHandler.observer = BOOMR.utils.addObserver(
      d,
      config,
      null, // no timeout
      handler.mutation_cb, // will always return true
      null, // no callback data
      handler
    );
    /* eslint-enable no-inline-comments */

    if (MutationHandler.observer) {
      MutationHandler.observer.config = config;

      BOOMR.subscribe("page_unload", MutationHandler.stop, null, MutationHandler);
    }
  };

  /**
   * If an event has triggered a resource to be fetched we add it to the list of pending events
   * here and wait for it to eventually resolve.
   *
   * @param {object} resource - [Resource]{@link AutoXHR#Resource} object we are waiting for
   *
   * @returns {?index} If we are already waiting for an event of this type null
   * otherwise index in the [queue]{@link MutationHandler#pending_event}.
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.addEvent = function(resource) {
    /* eslint-disable no-inline-comments */
    var ev = {
      type: resource.initiator,
      resource: resource,
      nodes_to_wait: 0,  // MO resources + xhrs currently outstanding + wait filter (max: 1)
      total_nodes: 0,  // total MO resources + xhrs + wait filter (max: 1)
      resources: [],  // resources reported by MO handler (no xhrs)
      xhr_resources: [],  // resources reported by xhr monitoring (for debugging only)
      complete: false,
      aborted: false,  // this event was aborted
      firedEarlyBeacon: false
    },
        i,
        last_ev,
        last_ev_index,
        index = this.pending_events.length,
        self = this;
    /* eslint-enable no-inline-comments */

    for (i = index - 1; i >= 0; i--) {
      if (this.pending_events[i] && !this.pending_events[i].complete) {
        last_ev = this.pending_events[i];
        last_ev_index = i;
        break;
      }
    }

    if (last_ev) {
      if (last_ev.type === "click" &&
          impl.singlePageApp &&
          impl.spaStartFromClick &&
          ev.type === "xhr") {
        // spaStartFromClick active, we had a click, and this is an XHR

        // mark that this XHR came from a click event
        ev.resource.fromClick = true;

        // transition XHR start time from the click
        ev.resource.timing.click = last_ev.resource.timing.requestStart;
        ev.resource.timing.requestStart = last_ev.resource.timing.requestStart;

        ev.interesting = last_ev.interesting || 0;
        ev.total_nodes += last_ev.total_nodes;
        ev.resources = last_ev.resources.concat(ev.resources);
        ev.xhr_resources = last_ev.xhr_resources.concat(ev.xhr_resources);

        // stop the click event
        this.pending_events[last_ev_index] = undefined;
        this.watch--;
      }
      else if ((last_ev.type === "click" || last_ev.resource.fromClick) &&
               impl.singlePageApp &&
               impl.spaStartFromClick &&
               ev.type === "spa") {
        // spaStartFromClick active, we have a click (or XHR from click) active,
        // and this is a SPA

        // transition all XHR times
        ev.resource.timing = last_ev.resource.timing;

        ev.interesting = last_ev.interesting || 0;
        ev.total_nodes += last_ev.total_nodes;
        ev.resources = last_ev.resources.concat(ev.resources);

        // add previous XHR URL
        if (last_ev.resource.url) {
          ev.xhr_resources.push(last_ev.resource.url);
        }

        // add any other XHRs tracked in the previous
        ev.xhr_resources = ev.xhr_resources.concat(last_ev.xhr_resources);

        // stop the previous event
        this.pending_events[last_ev_index] = undefined;
        this.watch--;
      }
      else if (last_ev.type === "click") {
        // 3.1 & 3.3
        if (last_ev.nodes_to_wait === 0 || !last_ev.resource.url) {
          this.pending_events[last_ev_index] = undefined;
          this.watch--;
          // continue with new event
        }
        // last_ev will no longer receive watches as ev will receive them
        // last_ev will wait for all interesting nodes and then send event
      }
      else if (last_ev.type === "xhr") {
        // 3.2
        if (ev.type === "click") {
          return null;
        }

        // 3.4
        // add this resource to the current event
        else if (ev.type === "xhr") {
          handler.add_event_resource(resource);

          return null;
        }
      }
      else if (BOOMR.utils.inArray(last_ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
        // add this resource to the current event
        if (ev.type === "xhr") {
          handler.add_event_resource(resource);

          return null;
        }

        // if we have a pending SPA event, send an aborted load beacon before
        // adding the new SPA event
        if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
          debugLog("Aborting previous SPA navigation");

          // mark the end of this navigation as now
          last_ev.resource.timing.loadEventEnd = BOOMR.now();
          last_ev.aborted = true;

          // send the previous SPA
          this.sendEvent(last_ev_index);
        }
      }
    }

    if (ev.type === "click") {
      // if we don't have a MutationObserver then we just abort.
      // If an XHR starts later then it will be tracked as its own new event
      if (!MutationHandler.observer) {
        return null;
      }

      // give Click events 50ms to see if they resulted
      // in DOM mutations (and thus it is an 'interesting event').
      this.setTimeout(impl.xhrIdleTimeout, index);
    }
    else if (ev.type === "xhr") {
      // XHR events will not set a timeout yet.
      // The XHR's load finished callback will start the timer.
      // Increase node count since we are waiting for the XHR that started this event
      ev.nodes_to_wait++;
      ev.total_nodes++;
      // we won't track mutations yet, we'll monitor only when at least one of the
      // tracked xhr nodes has had a response
      ev.ignoreMO = true;
    }
    else if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
      // try to start the MO, in case we haven't had the chance to yet
      MutationHandler.start();

      if (!resource.wait) {
        // give SPAs a bit more time to do something since we know this was
        // an interesting event.
        this.setTimeout(impl.spaIdleTimeout, index);
      }
      else {
        // a wait filter isn't a node, but we'll use the same logic.
        // Increase node count since we are waiting for the waitComplete call.
        ev.nodes_to_wait++;
        ev.total_nodes++;

        // waitComplete() should be called once the held beacon is complete.
        // The caller is responsible for clearing the .wait flag
        resource.waitComplete = function() {
          self.load_finished(index);
          resource.waitComplete = undefined;
        };
      }
    }

    this.watch++;
    this.pending_events.push(ev);
    resource.index = index;

    return index;
  };

  /**
   * If called with an event in the [pending events list]{@link MutationHandler#pending_events}
   * trigger a beacon for this event.
   *
   * When the beacon is sent for this event is depending on either having a crumb, in which case this
   * beacon will be sent immediately. If that is not the case we wait 5 seconds and attempt to send the
   * event again.
   *
   * @param {number} index Index in event list to send
   *
   * @returns {undefined} Returns early if the event already completed
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.sendEvent = function(index) {
    var ev = this.pending_events[index],
        self = this,
        now = BOOMR.now();

    if (!ev || ev.complete) {
      return;
    }

    this.clearTimeout(index);

    if (BOOMR.readyToSend()) {
      ev.complete = true;

      this.watch--;

      // for SPA events, the resource's URL may be set to the previous navigation's URL.
      // reset it to the current document URL
      if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
        ev.resource.url = d.URL;
      }

      // if this was a SPA soft nav with no URL change and did not trigger additional resources
      // then we will not send a beacon
      if (ev.type === "spa" && ev.total_nodes === 0 && ev.resource.url === self.lastSpaLocation) {
        debugLog("SPA beacon cancelled, no URL change or resources triggered");
        BOOMR.fireEvent("spa_cancel");
        this.pending_events[index] = undefined;

        return;
      }

      // if click event did not trigger additional resources or doesn't have
      // a url then do not send a beacon
      if (ev.type === "click" && (ev.total_nodes === 0 || !ev.resource.url)) {
        debugLog("Click beacon cancelled, no resources triggered or no resource URL");
        this.pending_events[index] = undefined;

        return;
      }

      // when in spaStartFromClick mode, if we're tracking clicks, transition them to an 'xhr' event
      if (ev.type === "click" && impl.singlePageApp && impl.spaStartFromClick) {
        ev.type = ev.resource.initiator = "xhr";
      }

      // if this was a XHR that did not trigger additional resources then we will not send a beacon,
      // note that XHRs start out with total_nodes=1 to account for itself
      if (impl.xhrRequireChanges &&
          ev.type === "xhr" &&
          ev.total_nodes === 1 &&
          (typeof ev.interesting === "undefined" || ev.interesting === 0) &&
          !matchesAlwaysSendXhr(ev.resource.url, impl.alwaysSendXhr)) {
        debugLog("XHR beacon cancelled, no resources triggered");
        this.pending_events[index] = undefined;

        return;
      }

      if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
        // save the last SPA location
        self.lastSpaLocation = ev.resource.url;

        if (!ev.forced) {
          // if this was a SPA soft nav that triggered no additional resources, call it
          // a 1ms duration
          if (ev.type === "spa" && ev.total_nodes === 0) {
            ev.resource.timing.loadEventEnd = ev.resource.timing.requestStart + 1;
          }

          // if the event wasn't forced then the SPA hard nav should have the page's
          // onload end as its minimum load end time
          if (ev.type === "spa_hard") {
            var p = BOOMR.getPerformance();

            if (p && p.timing && p.timing.loadEventEnd && ev.resource.timing.loadEventEnd &&
                ev.resource.timing.loadEventEnd < p.timing.loadEventEnd) {
              ev.resource.timing.loadEventEnd = p.timing.loadEventEnd;
            }
          }
        }
      }

      this.sendResource(ev.resource, index);
    }
    else {
      // No crumb, so try again after 500ms seconds
      setTimeout(function() {
        self.sendEvent(index);
      }, READY_TO_SEND_WAIT);
    }
  };

  /**
   * Creates and triggers sending a beacon for a Resource that has finished loading.
   *
   * @param {Resource} resource The Resource to send a beacon on
   * @param {number} eventIndex index of the event in the pending_events array
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.sendResource = function(resource, eventIndex) {
    var self = this,
        ev = self.pending_events[eventIndex];

    // Use 'requestStart' as the startTime of the resource, if given
    var startTime = resource.timing ? resource.timing.requestStart : undefined;

    /**
     * Called once the resource can be sent
     * @param {boolean} [markEnd] Sets loadEventEnd once the function is run
     * @param {number} [endTimestamp] End timestamp
     */
    var sendResponseEnd = function(markEnd, endTimestamp) {
      if (markEnd) {
        resource.timing.loadEventEnd = endTimestamp || BOOMR.now();
      }

      // send any queued beacons first
      BOOMR.real_sendBeacon();

      // If the resource has an onComplete event, trigger it.
      if (resource.onComplete) {
        resource.onComplete(resource);
      }

      // Add ResourceTiming data to the beacon, starting at when 'requestStart'
      // was for this resource.
      if (BOOMR.plugins.ResourceTiming &&
          BOOMR.plugins.ResourceTiming.is_enabled() &&
          resource.timing &&
          resource.timing.requestStart) {
        // Save resourceTiming data onto beacon as it may not go out right away
        resource.restiming = BOOMR.plugins.ResourceTiming.getCompressedResourceTiming(
          resource.timing.requestStart,
          resource.timing.loadEventEnd
        );
      }

      // For SPAs, calculate Back-End and Front-End timings
      if (BOOMR.utils.inArray(resource.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
        self.calculateSpaTimings(resource);

        // If the SPA load was aborted, set the rt.quit and rt.abld flags
        if (typeof eventIndex === "number" && self.pending_events[eventIndex].aborted) {
          // Save the URL otherwise it might change before we have a chance to put it on the beacon
          BOOMR.addVar("pgu", d.URL, true);
          BOOMR.addVar("rt.quit", "", true);
          BOOMR.addVar("rt.abld", "", true);
        }
      }

      BOOMR.responseEnd(resource, startTime, resource);

      if (typeof eventIndex === "number") {
        self.pending_events[eventIndex] = undefined;
      }
    };

    // if this is a SPA Hard navigation, make sure it doesn't fire until onload
    if (resource.initiator === "spa_hard") {
      // don't wait for onload if this was an aborted SPA navigation
      if ((!ev || !ev.aborted) && !BOOMR.hasBrowserOnloadFired()) {
        BOOMR.utils.addListener(w, "load", function() {
          var loadTimestamp = BOOMR.now();

          // run after the 'load' event handlers so loadEventEnd is captured
          BOOMR.setImmediate(function() {
            sendResponseEnd(true, loadTimestamp);
          });
        });

        return;
      }
    }

    sendResponseEnd(false);
  };

  /**
   * Calculates SPA Back-End and Front-End timings for Hard and Soft
   * SPA navigations.
   *
   * @param {object} resource Resouce to calculate for
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.calculateSpaTimings = function(resource) {
    var p = BOOMR.getPerformance();

    if (!p || !p.timing) {
      return;
    }

    //
    // Hard Navigation:
    // Use same timers as a traditional navigation, where the root HTML's
    // timestamps are used for Back-End calculation.
    //
    if (resource.initiator === "spa_hard") {
      // ensure RT picks up the correct timestamps
      resource.timing.responseEnd = p.timing.responseStart;

      // use navigationStart instead of fetchStart to ensure Back-End time
      // includes any redirects
      resource.timing.fetchStart = p.timing.navigationStart;
    }
    else {
      //
      // Soft Navigation:
      // We need to overwrite two timers: Back-End (t_resp) and Front-End (t_page).
      //
      // For Single Page Apps, we're defining these as:
      // Back-End: Any timeslice where a XHR or JavaScript was outstanding
      // Front-End: Total Time - Back-End
      //
      if (!BOOMR.plugins.ResourceTiming ||
          !BOOMR.plugins.ResourceTiming.is_supported()) {
        return;
      }

      // first, gather all Resources that were outstanding during this SPA nav
      var resources = BOOMR.plugins.ResourceTiming.getFilteredResourceTiming(
        resource.timing.requestStart,
        resource.timing.loadEventEnd,
        impl.spaBackEndResources).entries;

      // determine the total time based on the SPA logic
      var totalTime = Math.round(resource.timing.loadEventEnd - resource.timing.requestStart);

      if (!resources || !resources.length) {
        // If ResourceTiming is supported, but there were no entries,
        // this was all Front-End time
        resource.timers = {
          t_resp: 0,
          t_page: totalTime,
          t_done: totalTime
        };

        return;
      }

      // we currently can't reliably tell when a SCRIPT has loaded
      // set an upper bound on responseStart/responseEnd for the resources to the SPA's loadEventEnd
      var maxResponseEnd = resource.timing.loadEventEnd - p.timing.navigationStart;

      for (var i = 0; i < resources.length; i++) {
        if (resources[i].responseStart > maxResponseEnd) {
          resources[i].responseStart = maxResponseEnd;
          resources[i].responseEnd = maxResponseEnd;
        }
        else if (resources[i].responseEnd > maxResponseEnd) {
          resources[i].responseEnd = maxResponseEnd;
        }
      }

      // calculate the Back-End time based on any time those resources were active
      var backEndTime = Math.round(BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion(resources));

      // front-end time is anything left over
      var frontEndTime = totalTime - backEndTime;

      if (backEndTime < 0 || totalTime < 0 || frontEndTime < 0) {
        // some sort of error, don't put on the beacon
        BOOMR.addError("Incorrect SPA time calculation");

        return;
      }

      // set timers on the resource so RT knows to use them
      resource.timers = {
        t_resp: backEndTime,
        t_page: frontEndTime,
        t_done: totalTime
      };
    }
  };

  /**
   * Will create a new timer waiting for `timeout` milliseconds to wait until a
   * resources load time has ended or should have ended. If the timeout expires
   * the Resource at `index` will be marked as timedout and result in an error Resource marked with
   * [XHR_STATUS_TIMEOUT]{@link AutoXHR#XHR_STATUS_TIMEOUT} as status information.
   *
   * @param {number} timeout - time ot wait for the resource to be loaded
   * @param {number} index - Index of the {@link Resource} in our {@link MutationHandler#pending_events}
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.setTimeout = function(timeout, index) {
    var self = this;
    // we don't need to check if this is the latest pending event, the check is
    // already done by all callers of this function

    if (!timeout) {
      return;
    }

    this.clearTimeout(index);

    this.timer = setTimeout(function() {
      self.timedout(index);
    }, timeout);
  };

  /**
   * Sends a Beacon for the [Resource]{@link AutoXHR#Resource} at `index` with the status
   * [XHR_STATUS_TIMEOUT]{@link AutoXHR#XHR_STATUS_TIMEOUT} code, If there are multiple resources attached to the
   * `pending_events` array at `index`.
   *
   * @param {number} index - Index of the event in pending_events array
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.timedout = function(index) {
    var ev;

    this.clearTimeout(index);

    ev = this.pending_events[index];

    if (ev) {
      // SPA page loads

      if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS) && !BOOMR.hasBrowserOnloadFired()) {
        // browser onload hasn't fired yet, lets wait because there might be more interesting
        // things on the way
        this.setTimeout(impl.spaIdleTimeout, index);

        return;
      }

      if (ev.nodes_to_wait === 0) {
        // send event if there are no outstanding downloads
        this.sendEvent(index);
      }

      // if there are outstanding downloads left, they will trigger a
      // sendEvent for the SPA/XHR pending event once complete
    }
  };

  /**
   * If this instance of the {@link MutationHandler} has a `timer` set, clear it
   *
   * @param {number} index - Index of the event in pending_events array
   *
   * @memberof MutationHandler
   * @method
   */
  MutationHandler.prototype.clearTimeout = function(index) {
    // only clear timeout if this is the latest pending event.
    // If it is not the latest, then allow the timer to timeout. This can
    // happen in cases of concurrency, eg. an xhr event is waiting in timeout and
    // a spa event is triggered.
    if (this.timer && index === (this.pending_events.length - 1)) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  /**
   * Once an asset has been loaded and the resource appeared in the page we
   * check if it was part of the interesting events on the page and mark it as finished.
   *
   * @callback load_cb
   * @param {Event} ev - Load event Object
   *
   * @memberof MutationHandler
   */
  MutationHandler.prototype.load_cb = function(ev, resourceNum) {
    var target,
        index,
        now = BOOMR.now();

    target = ev.target || ev.srcElement;

    if (!target || !target._bmr) {
      return;
    }

    index = target._bmr.idx;
    resourceNum = typeof resourceNum !== "undefined" ? resourceNum : (target._bmr.res || 0);

    if (target._bmr.end[resourceNum]) {
      // If we've already set the end value, don't call load_finished
      // again.  This might occur on IMGs that are 404s, which fire
      // 'error' then 'load' events
      return;
    }

    target._bmr.end[resourceNum] = now;

    this.load_finished(index, now);
  };

  /**
   * Clear the flag preventing DOM mutation monitoring
   *
   * @param {number} index - Index of the event in pending_events array
   *
   * @memberof MutationHandler
   * @method
   */
  MutationHandler.prototype.monitorMO = function(index) {
    var current_event = this.pending_events[index];

    // event aborted
    if (!current_event) {
      return;
    }

    delete current_event.ignoreMO;
  };

  /**
   * Decrement the number of [nodes_to_wait]{@link AutoXHR#.PendingEvent} for the
   * [PendingEvent Object]{@link AutoXHR#.PendingEvent}.
   *
   * If the nodes_to_wait is decremented to 0 and the event type was SPA:
   *
   * When we're finished waiting on the last node,
   * the MVC engine (eg AngularJS) might still be doing some processing (eg
   * on an XHR) before it adds some additional content (eg IMGs) to the page.
   * We should wait a while (1 second) longer to see if this happens.  If
   * something else is added, we'll continue to wait for that content to
   * complete.  If nothing else is added, the end event will be the
   * timestamp for when this load_finished(), not 1 second from now.
   *
   * @param {number} index - Index of the event found in the pending_events array
   * @param {TimeStamp} loadEventEnd - TimeStamp at which the resource was finished loading
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.load_finished = function(index, loadEventEnd) {
    var current_event = this.pending_events[index];

    // event aborted
    if (!current_event) {
      return;
    }

    current_event.nodes_to_wait--;

    if (current_event.nodes_to_wait === 0) {
      // mark the end timestamp with what was given to us, or, now
      current_event.resource.timing.loadEventEnd = loadEventEnd || BOOMR.now();

      // For Single Page Apps, when we're finished waiting on the last node,
      // the MVC engine (eg AngularJS) might still be doing some processing (eg
      // on an XHR) before it adds some additional content (eg IMGs) to the page.
      // We should wait a while (1 second) longer to see if this happens.  If
      // something else is added, we'll continue to wait for that content to
      // complete.  If nothing else is added, the end event will be the
      // timestamp for when this load_finished(), not 1 second from now.

      // We use the same behavior for XHR and click events but with a smaller timeout

      if (index === (this.pending_events.length - 1)) {
        // if we're the latest pending event then extend the timeout
        if (BOOMR.utils.inArray(current_event.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
          // if we reached here then at least one resource was fetched.
          // Send our SPA early beacon
          if (!current_event.firedEarlyBeacon && BOOMR.plugins.Early && BOOMR.plugins.Early.is_supported()) {
            if (this.timerEarlyBeacon) {
              clearTimeout(this.timerEarlyBeacon);
              this.timerEarlyBeacon = null;
            }

            this.timerEarlyBeacon = setTimeout(function() {
              handler.timerEarlyBeacon = null;

              // don't send an early beacon now if we are waiting for a new resource that started during our timeout
              if (current_event.firedEarlyBeacon || current_event.nodes_to_wait !== 0) {
                return;
              }

              current_event.firedEarlyBeacon = true;
              debugLog("Triggering an early beacon");
              BOOMR.plugins.Early.sendEarlyBeacon(current_event.resource, current_event.type);

              // give the SPA framework a bit of time to load the resource
            }, SPA_EARLY_TIMEOUT);
          }

          this.setTimeout(impl.spaIdleTimeout, index);
        }
        else {
          this.setTimeout(impl.xhrIdleTimeout, index);
        }
      }
      else {
        // this should never happen for SPA events, they should always be the latest
        // pending event.
        this.sendEvent(index);
      }
    }
  };

  /**
   * Determines if we should wait for resources that would be fetched by the
   * specified node.
   *
   * @param {Element} node DOM node
   * @param {number} index Event index
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.wait_for_node = function(node, index) {
    var self = this,
        current_event,
        els,
        interesting = false,
        i,
        l,
        url,
        exisitingNodeSrcUrlChanged = false,
        resourceNum,
        domHeight,
        domWidth,
        listener;

    // only images, iframes and links if stylesheet
    // nodeName for SVG:IMAGE returns `image` in lowercase
    // scripts would be nice to track but their onload event is not reliable
    if (node && node.nodeName &&
        (node.nodeName.toUpperCase().match(/^(IMG|IFRAME|IMAGE)$/) ||
        (node.nodeName.toUpperCase() === "LINK" && node.rel && node.rel.match(/\bstylesheet\b/i)))) {
      // if the attribute change affected the src attributes we want to know that
      // as that means we need to fetch a new Resource from the server
      // We don't look at currentSrc here because that isn't set until after the resource fetch has started,
      // which will be after the MO observer completes.
      if (node._bmr && typeof node._bmr.res === "number" && node._bmr.end[node._bmr.res]) {
        exisitingNodeSrcUrlChanged = true;
      }

      // we put xlink:href before href because node.href works for <SVG:IMAGE> elements,
      // but does not return a string
      url = node.src ||
        (typeof node.getAttribute === "function" && node.getAttribute("xlink:href")) ||
        (w.SVGAnimatedString && node.href instanceof w.SVGAnimatedString && node.href.baseVal) ||
        node.href;

      // we get called from src/href attribute changes but also from nodes being added
      // which may or may not have been seen here before.
      // Check that if we've seen this node before, that the src/href in this case is
      // different which means we need to fetch a new Resource from the server
      if (node._bmr && node._bmr.url !== url) {
        exisitingNodeSrcUrlChanged = true;
      }

      if (exisitingNodeSrcUrlChanged) {
        if (typeof node._bmr.listener === "function") {
          self.load_cb({target: node, type: "changed"});
          // remove listeners
          node.removeEventListener("load", node._bmr.listener);
          node.removeEventListener("error", node._bmr.listener);
          delete node._bmr.listener;
        }

        /* BEGIN_DEBUG */
        debugLog("mutation URL changed from " + node._bmr.url +
          " to " + url +
          " for event idx: " + node._bmr.idx +
          " node:" + node._bmr.res);
        /* END_DEBUG */
      }

      // no URL or javascript: or about: or data: URL, so no network activity
      if (!url || !url.match || url.match(/^(about:|javascript:|data:)/i)) {
        return false;
      }

      if (node.nodeName === "IMG") {
        if (node.naturalWidth && !exisitingNodeSrcUrlChanged) {
          // img already loaded
          return false;
        }
        else if (typeof node.getAttribute === "function" && node.getAttribute("src") === "") {
          // placeholder IMG
          return false;
        }
        else if (node.loading === "lazy") {
          // lazy loading - we can't know when this request will be triggered
          return false;
        }
      }

      // IFRAMEs whose SRC has changed will not fire a load event again
      if (node.nodeName === "IFRAME" && exisitingNodeSrcUrlChanged) {
        return false;
      }

      //
      // Don't track pixels: <= 1px, display:none or visibility:hidden.
      // Only use attributes, not computed styles, to avoid forcing layout
      //

      // First try to get the number of pixels from width or height attributes
      if (typeof node.getAttribute === "function") {
        domHeight = parseInt(node.getAttribute("height"), 10);
        domWidth = parseInt(node.getAttribute("width"), 10);
      }

      // If not specified, we can look at the style height/width.  We can
      // only be confident about "0", "0px" or "1px" that it's small -- things
      // like "0em" or "0in" would be relative.  Some things that are actually
      // small might not match this list, but it's safer to only check against
      // a known list.
      if (isNaN(domHeight)) {
        domHeight = (node.style &&
           (node.style.height === "0" ||
            node.style.height === "0px" ||
            node.style.height === "1px")) ? 0 : undefined;
      }

      if (isNaN(domWidth)) {
        domWidth = (node.style &&
           (node.style.width === "0" ||
            node.style.width === "0px" ||
            node.style.width === "1px")) ? 0 : undefined;
      }

      // Skip anything where *both* dimensions are 1px or less
      if (!isNaN(domHeight) &&
          domHeight <= 1 &&
          !isNaN(domWidth) &&
          domWidth <= 1) {
        return false;
      }

      // Skip anything where *either* dimension is 0px
      if (domHeight === 0 || domWidth === 0) {
        return false;
      }

      // Check against display:none, visibility:hidden, opacity: 0
      if (node.style && (
        (node.style.display === "none") ||
        (node.style.visibility === "hidden") ||
        (node.style.opacity === "0"))) {
        return false;
      }

      // Run any final customer-defined DOM exclusions
      if (impl.domExcludeFilter(node)) {
        debugLog("Exclude for DOM element matched, not monitoring");

        // excluded resource, so abort
        return false;
      }

      current_event = this.pending_events[index];

      if (!current_event) {
        return false;
      }

      // determine the resource number for this request
      resourceNum = current_event.resources.length;

      // keep track of all resources (URLs) seen for the root resource
      if (!current_event.urls) {
        current_event.urls = {};
      }

      if (current_event.urls[url]) {
        // we've already seen this URL, no point in waiting on it twice
        return false;
      }

      // if we don't have a URL yet (i.e. a click started this), use
      // this element's URL
      if (!current_event.resource.url) {
        a.href = url;

        if (impl.xhrExcludeFilter(a)) {
          debugLog("Exclude for " + a.href + " matched. Excluding");

          // excluded resource, so abort
          return false;
        }

        current_event.resource.url = a.href;
      }

      // create a bookkeeping ._bmr attribute
      if (!node._bmr) {
        node._bmr = {
          end: {}
        };
      }

      // update _bmr with details about this resource
      node._bmr.res = resourceNum;
      node._bmr.idx = index;
      delete node._bmr.end[resourceNum];
      node._bmr.url = url;

      listener = function(ev) {
        self.load_cb(ev, resourceNum);

        // if either event fires then cleanup both listeners
        node.removeEventListener("load", listener);
        node.removeEventListener("error", listener);

        delete node._bmr.listener;

        debugLog("mutation URL on" + ev.type + ", for event idx: " + index + " node: " + resourceNum);
      };

      debugLog("Monitoring mutation URL: " + url + " for event idx: " + index + " node: " + resourceNum);

      node._bmr.listener = listener;
      node.addEventListener("load", listener);
      node.addEventListener("error", listener);

      // increase the number of outstanding resources by one
      current_event.nodes_to_wait++;

      // ensure the timeout is cleared
      this.clearTimeout(index);

      // increase the number of total resources by one
      current_event.total_nodes++;

      current_event.resources.push(node);

      // Note that we're tracking this URL
      current_event.urls[url] = 1;

      interesting = true;
    }
    // if it's an Element node such as <p> or <div>, find all the images contained in it
    else if (node.nodeType === Node.ELEMENT_NODE) {
      ["IMAGE", "IMG"].forEach(function(tagName) {
        els = node.getElementsByTagName(tagName);

        if (els && els.length) {
          for (i = 0, l = els.length; i < l; i++) {
            interesting |= this.wait_for_node(els[i], index);
          }
        }
      }, this);
    }

    return interesting;
  };

  /**
   * Adds a resource to the current event.
   *
   * Might fail (return -1) if:
   * a) There are no pending events
   * b) The current event is complete
   * c) There's no passed-in resource
   *
   * @param resource Resource
   *
   * @return Event index, or -1 on failure
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.add_event_resource = function(resource) {
    var index = this.pending_events.length - 1,
        current_event;

    if (index < 0) {
      return -1;
    }

    current_event = this.pending_events[index];

    if (!current_event) {
      return -1;
    }

    if (!resource) {
      return -1;
    }

    debugLog("Monitoring " + resource.type +  " URL: " + resource.url + " for event id: " + index);

    // for debugging
    current_event.xhr_resources.push(resource.url);

    // increase the number of outstanding resources by one
    current_event.nodes_to_wait++;
    // increase the number of total resources by one
    current_event.total_nodes++;

    resource.index = index;

    // this resource is a node being tracked by an existing pending event
    resource.node = true;

    return index;
  };

  /**
   * Callback called once [Mutation Observer instance]{@link MutationObserver#observer}
   * noticed a mutation on the page. This method will determine if a mutation on
   * the page is interesting or not.
   *
   * @callback mutation_cb
   * @param {Mutation[]} mutations - Mutation array describing changes to the DOM
   *
   * @memberof MutationHandler
   */
  MutationHandler.prototype.mutation_cb = function(mutations) {
    var self, index, evt;

    if (!this.watch) {
      return true;
    }

    self = this;
    index = this.pending_events.length - 1;

    if (index < 0 || !this.pending_events[index]) {
      // Nothing waiting for mutations
      return true;
    }

    evt = this.pending_events[index];

    // for xhr events, only track mutations if at least one of the tracked xhr nodes has
    // had a response
    if (evt.ignoreMO) {
      return true;
    }

    if (typeof evt.interesting === "undefined") {
      evt.interesting = false;
    }

    if (mutations && mutations.length) {
      evt.resource.timing.domComplete = BOOMR.now();

      mutations.forEach(function(mutation) {
        var i, l, node;

        if (mutation.type === "attributes") {
          evt.interesting |= self.wait_for_node(mutation.target, index);
        }
        else if (mutation.type === "childList") {
          // Go through any new nodes and see if we should wait for them
          l = mutation.addedNodes.length;
          for (i = 0; i < l; i++) {
            evt.interesting |= self.wait_for_node(mutation.addedNodes[i], index);
          }

          // Go through any removed nodes, and for IFRAMEs, see if we were
          // waiting for them.  If so, stop waiting, as removed IFRAMEs
          // don't trigger load or error events.
          l = mutation.removedNodes.length;
          for (i = 0; i < l; i++) {
            node = mutation.removedNodes[i];

            if (node.nodeName === "IFRAME" && node._bmr) {
              self.load_cb({target: node, type: "removed"});
            }
          }
        }
      });
    }

    if (!evt.interesting && !evt.timeoutExtended) {
      // timeout the event if we haven't already created a timer and
      // we didn't have any interesting nodes for this MO callback or
      // any prior callbacks
      this.setTimeout(UNINTERESTING_MUTATION_TIMEOUT, index);

      // only extend the timeout for an interesting thing to happen once
      evt.timeoutExtended = true;
    }

    return true;
  };

  /**
   * Determines if the resources queue is empty
   *
   * @return {boolean} True if there are no outstanding resources
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.queue_is_empty = function() {
    return this.nodesWaitingFor() === 0;
  };

  /**
   * Determines how many nodes are being waited on
   * @param {number} [index] Optional Event index, defaults to last event
   *
   * @return {number} Number of nodes being waited on
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.nodesWaitingFor = function(index) {
    var ev;

    if (this.pending_events.length === 0) {
      return 0;
    }

    if (typeof index === "undefined") {
      index = this.pending_events.length - 1;
    }

    ev = this.pending_events[index];

    if (!ev) {
      return 0;
    }

    return ev.nodes_to_wait;
  };

  /**
   * Completes the current event, marking the end time as 'now'.
   * @param {number} [index] Optional Event index, defaults to last event
   *
   * @method
   * @memberof MutationHandler
   */
  MutationHandler.prototype.completeEvent = function(index) {
    var now = BOOMR.now(),
        ev;

    if (this.pending_events.length === 0) {
      // no active events
      return;
    }

    if (typeof index === "undefined") {
      index = this.pending_events.length - 1;
    }

    ev = this.pending_events[index];

    if (!ev) {
      // unknown event
      return;
    }

    // set the end timestamp to now
    ev.resource.timing.loadEventEnd = now;

    // note that this end was forced
    ev.forced = true;

    // complete this event
    this.sendEvent(index);
  };

  handler = new MutationHandler();

  /**
   * Subscribe to click events on the page and see if they are triggering new
   * resources fetched from the network in which case they are interesting
   * to us!
   */
  function instrumentClick() {
    // Capture clicks and wait 50ms to see if they result in DOM mutations
    BOOMR.subscribe("click", function() {
      if (impl.singlePageApp && !impl.spaStartFromClick) {
        // In a SPA scenario, only route changes (or events from the SPA
        // framework) trigger an interesting event.
        return;
      }

      var resource = { timing: {}, initiator: "click" };

      if (!BOOMR.orig_XMLHttpRequest ||
          BOOMR.orig_XMLHttpRequest === w.XMLHttpRequest) {
        // do nothing if we have un-instrumented XHR
        return;
      }

      resource.timing.requestStart = BOOMR.now();
      handler.addEvent(resource);
    });
  }

  /**
   * Determines whether or not the specified url matches the
   * {@link BOOMR.plugins.AutoXHR.init|alwaysSendXhr} list.
   *
   * `alwaysSendXhr` can be:
   * * a `boolean`, if `true` meaning every XHR will send a beacon
   * * a `function` which returns `true` for XHRs that should send a beacon
   * * an array of `strings` or regular expressions which match to XHRs
   *   that should send a beacon
   *
   * @param {string} url URL to match
   * @param {string[]|RegExp[]|function|boolean} alwaysSendXhr Configuration
   *
   * @returns {boolean} True if the URL should always send a beacon
   */
  function matchesAlwaysSendXhr(url, alwaysSendXhr) {
    var i, rule;

    if (!alwaysSendXhr || !url) {
      return false;
    }

    // alwaysSendXhr is a boolean
    if (typeof alwaysSendXhr === "boolean") {
      return alwaysSendXhr === true;
    }

    // alwaysSendXhr is a function
    if (typeof alwaysSendXhr === "function") {
      try {
        return alwaysSendXhr(url) === true;
      }
      catch (e) {
        return false;
      }
    }

    // alwaysSendXhr is a list of strings or regular expressions
    if (BOOMR.utils.isArray(alwaysSendXhr)) {
      for (i = 0; i < alwaysSendXhr.length; i++) {
        rule = alwaysSendXhr[i];

        if (typeof rule === "string" && rule === url) {
          return true;
        }
        else if (rule instanceof RegExp) {
          if (rule.test(url)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Replace original window.fetch with our implementation instrumenting
   * any fetch requests happening afterwards
   */
  function instrumentFetch() {
    if (!impl.monitorFetch ||
        // we don't check that fetch is a native function in case it was already wrapped
        // by another vendor
        typeof w.fetch !== "function" ||
        // native fetch support will define these, some polyfills like `unfetch` will not
        typeof w.Request !== "function" ||
        typeof w.Response !== "function" ||
        // native fetch needs Promise support
        typeof w.Promise !== "function" ||
        // if our window doesn't have fetch then it was probably polyfilled in the top window
        typeof window.fetch !== "function" ||
        // Github's `whatwg-fetch` polyfill sets this flag
        w.fetch.polyfill) {
      return;
    }

    if (BOOMR.proxy_fetch &&
        BOOMR.proxy_fetch === w.fetch) {
      // already instrumented
      return;
    }

    if (BOOMR.wrapped_fetch) {
      // Already wrapped, but something else has wrapped after us -- don't wrap again,
      // or we may encounter an infinite loop.
      return;
    }

    if (BOOMR.proxy_fetch &&
        BOOMR.orig_fetch &&
        BOOMR.orig_fetch === w.fetch) {
      // was once instrumented and then uninstrumented, so just reapply the old instrumented object
      w.fetch = BOOMR.proxy_fetch;

      return;
    }

    // if there's a orig_fetch on the window, use that first (if another lib is overwriting fetch)
    BOOMR.orig_fetch = w.orig_fetch || w.fetch;

    BOOMR.proxy_fetch = function(input, init) {
      var url, method, payload,
          // we want to keep initiator type as `xhr` for backwards compatibility.
          // We'll differentiate fetch by `http.type=f` beacon param
          resource = { timing: {}, initiator: "xhr" };

      // case where fetch() is called with a Request object
      if (typeof input === "object" && input instanceof w.Request) {
        url = input.url;

        // init overrides input
        method = (init && init.method) || input.method || "GET";

        if (impl.captureXhrRequestResponse) {
          payload = (init && init.body) || input.body || undefined;
        }
      }
      // case where fetch() is called with a string url (or anything else)
      else {
        url = input;
        method = (init && init.method) || "GET";

        if (impl.captureXhrRequestResponse) {
          payload = (init && init.body) || undefined;
        }
      }

      a.href = url;

      if (impl.xhrExcludeFilter(a)) {
        // this fetch should be excluded from instrumentation
        BOOMR.debug("Exclude found for resource: " + a.href + " Skipping Fetch instrumentation!", "AutoXHR");

        // call the original open method
        return BOOMR.orig_fetch.apply(w, arguments);
      }

      BOOMR.fireEvent("xhr_init", "fetch");

      resource.url = a.href;
      resource.method = method;

      // pending event type will still be "xhr"
      resource.type = "fetch";

      if (payload) {
        resource.requestPayload = payload;
      }

      BOOMR.fireEvent("xhr_send", {resource: resource});

      handler.addEvent(resource);

      try {
        if (!resource.timing.requestStart) {
          resource.timing.requestStart = BOOMR.now();
        }

        var promise = BOOMR.orig_fetch.apply(this, arguments);

        /**
         * wraps a onFulfilled or onRejection function that is passed to
         * a promise's `.then` method. Will attempt to detect when there
         * are no other promises in the chain that need to be executed and
         * then mark the resource as finished. For simplicity, we only track
         * the first `.then` call of each promise.
         *
         * @param {Promise} Promise that the callback is attached to
         * @param {function} onFulfilled or onRejection callback function
         * @param {Object} Fetch resource that we're handling in this promise
         *
         * @returns {function} Wrapped callback function
         */
        function wrapCallback(_promise, _fn, _resource) {
          function done() {
            var now;
            // check if the response body was used, if not then we'll
            // wait a little bit longer. Hopefully it is a short response
            // (posibly only containing headers and status) and the entry
            // will be available in RT if we wait.
            // We don't detect if the response was consumed from a cloned object

            if (_resource.fetchResponse && !_resource.fetchResponse.bodyUsed && impl.fetchBodyUsedWait) {
              now = BOOMR.now();
              _resource.responseBodyNotUsed = true;
              setTimeout(function() {
                impl.loadFinished(_resource, now);
              }, impl.fetchBodyUsedWait);
            }
            else {
              impl.loadFinished(_resource);
            }
          }

          /**
           * @returns {Promise} Promise result of callback or rethrows exception from callback
           */
          return function() {
            var p,
                np = _promise._bmrNextP;

            try {
              p = _fn.apply((this === window ? w : this), arguments);

              // no exception thrown, check if there's a onFulfilled
              // callback in the chain
              while (np && !np._bmrHasOnFulfilled) {
                // next promise in the chain
                np = np._bmrNextP;
              }

              if (!np) {
                // we didn't find one, if the callback result is a promise
                // then we'll wait for it to complete, if not mark this
                // resource as finished now
                if (p instanceof w.Promise) {
                  p.then = wrapThen(p, p.then, _resource);
                }
                else {
                  done();
                }
              }

              return p;
            }
            catch (e) {
              // exception thrown, check if there's a onRejected
              // callback in the chain
              while (np && !np._bmrHasOnRejected) {
                // next promise in the chain
                np = np._bmrNextP;
              }

              if (!np) {
                // we didn't find one, mark the resource as complete
                done();
              }

              // rethrow exception
              throw e;
            }
          };
        };

        /**
         * wraps `.then` so that we can in turn wrap onFulfilled or onRejection that
         * are passed to it. Wrapping `.then` will also trap calls from `.catch` and `.finally`
         *
         * @param {Promise} Promise that we're wrapping `.then` method for
         * @param {function} `.then` function that will be wrapped
         * @param {Object} Fetch resource that we're handling in this promise
         *
         * @returns {function} Wrapped `.then` function or original `.then` function
         * if `.then` was already called on this promise
         */
        function wrapThen(_promise, _then, _resource) {
          // only track the first `.then` call
          if (_promise._bmrNextP) {
            // return unwrapped `.then`
            return _then;
          }

          /**
           * @returns {Promise} Result of `.then` call
           */
          return function(onFulfilled, onRejection) {
            var args = Array.prototype.slice.call(arguments);

            if (args.length > 0) {
              if (typeof args[0] === "function") {
                args[0] = wrapCallback(_promise, args[0], _resource);
                _promise._bmrHasOnFulfilled = true;
              }

              if (args.length > 1) {
                if (typeof args[1] === "function") {
                  args[1] = wrapCallback(_promise, args[1], _resource);
                  _promise._bmrHasOnRejected = true;
                }
              }
            }

            var p = _then.apply(_promise, args);

            // next promise in the chain
            _promise._bmrNextP = p;

            // p should always be a Promise
            p.then = wrapThen(p, p.then, _resource);

            return p;
          };
        };

        // we can't just wrap functions that read the response (e.g.`.text`, `json`, etc.) or
        // instrument `.body.getReader`'s stream because they might never be called.
        // We'll wrap `.then` and all the callback handlers to figure out which
        // is the last handler to execute. Once the last handler runs, we'll mark the resource
        // as finished. For simplicity, we only track the first `.then` call of each promise
        promise.then = wrapThen(promise, promise.then, resource);

        return promise.then(function(response) {
          var i, res, ct,
              parseJson = false,
              parseXML = false;

          if (response.redirected) {
            resource.responseUrl = response.url;
          }

          if (response.status < 200 || response.status >= 400) {
            // put the HTTP error code on the resource if it's not a success
            resource.status = response.status;
          }

          resource.fetchResponse = response;

          if (resource.index >= 0) {
            // response is starting to come in, we'll start monitoring for
            // DOM mutations
            handler.monitorMO(resource.index);
          }

          if (impl.captureXhrRequestResponse) {
            // clone not supported in Safari yet
            if (typeof response.clone === "function") {
              // content-type detection to determine if we should parse json or xml
              ct = response.headers.get("content-type");

              if (ct) {
                parseJson = ct.indexOf("json") !== -1;
                parseXML = ct.indexOf("xml") !== -1;
              }

              resource.response = {};
              try {
                res = response.clone();
                res.text().then(function(text) {
                  resource.response.text = text;
                  // for fetch, we'll set raw to text value
                  resource.response.raw = text;

                  if (parseXML && typeof w.DOMParser === "function") {
                    resource.response.xml = (new w.DOMParser()).parseFromString(text, "text/xml");
                  }
                }).then(null, function(reason) {
                  // `.catch` will cause parse errors in old browsers
                  // empty (avoid unhandled rejection)
                });
              }
              catch (e) {
                // empty
              }

              if (parseJson) {
                try {
                  res = response.clone();
                  res.json().then(function(json) {
                    resource.response.json = json;
                  }).then(null, function(reason) {
                    // `.catch` will cause parse errors in old browsers
                    // empty (avoid unhandled rejection)
                  });
                }
                catch (e) {
                  // empty
                }
              }
            }
          }

          return response;
        }, function(reason) {
          // fetch() request failed (eg. cross-origin error, aborted, connection dropped, etc.)
          // we'll let the `.then` wrapper call finished for this resource

          // check if the fetch was aborted otherwise mark it as an error
          if (reason && (reason.name === "AbortError" || reason.code === 20)) {
            resource.status = XHR_STATUS_ABORT;
          }
          else {
            resource.status = XHR_STATUS_ERROR;
          }

          // rethrow the native method's exception
          throw reason;
        });
      }
      catch (e) {
        // there was an exception during fetch()
        resource.status = XHR_STATUS_OPEN_EXCEPTION;
        impl.loadFinished(resource);

        // rethrow the native method's exception
        throw e;
      }
    };

    // Overwrite window.fetch, ensuring the original is swapped back in
    // if the Boomerang IFRAME is unloaded.  uninstrumentFetch() may also
    // be used to swap the original back in.
    BOOMR.utils.overwriteNative(w, "fetch", BOOMR.proxy_fetch);
    BOOMR.wrapped_fetch = true;
  }

  /**
   * Put original fetch function back into place
   */
  function uninstrumentFetch() {
    if (typeof w.fetch === "function" &&
        BOOMR.orig_fetch && BOOMR.orig_fetch !== w.fetch) {
      w.fetch = BOOMR.orig_fetch;

      BOOMR.wrapped_fetch = false;
    }
  }

  /**
   * Replace original window.XMLHttpRequest with our implementation instrumenting
   * any AJAX Requests happening afterwards. This will also enable instrumentation
   * of mouse events (clicks) and start the {@link MutationHandler}
   */
  function instrumentXHR() {
    if (BOOMR.proxy_XMLHttpRequest &&
      BOOMR.proxy_XMLHttpRequest === w.XMLHttpRequest) {
      // already instrumented
      return;
    }

    if (BOOMR.wrapped_XMLHttpRequest) {
      // Already wrapped, but something else has wrapped after us -- don't wrap again,
      // or we may encounter an infinite loop.
      return;
    }

    if (BOOMR.proxy_XMLHttpRequest &&
      BOOMR.orig_XMLHttpRequest &&
      BOOMR.orig_XMLHttpRequest === w.XMLHttpRequest) {
      // was once instrumented and then uninstrumented, so just reapply the old instrumented object

      w.XMLHttpRequest = BOOMR.proxy_XMLHttpRequest;
      MutationHandler.start();

      return;
    }

    // if there's a orig_XMLHttpRequest on the window, use that first (if another lib is overwriting XHR)
    BOOMR.orig_XMLHttpRequest = w.orig_XMLHttpRequest || w.XMLHttpRequest;

    MutationHandler.start();

    instrumentClick();

    /**
     * Proxy `XMLHttpRequest` object
     * @class ProxyXHRImplementation
     */

    /**
     * Open an XMLHttpRequest.
     * If the URL passed as a second argument is in the BOOMR.xhr_exclude list ignore it and move on to request it
     * Otherwise add it to our list of resources to monitor and later beacon on.
     *
     * If an exception is caught will call loadFinished and set resource.status to {@link XHR_STATUS_OPEN_EXCEPTION}
     * Should the resource fail to load for any of the following reasons resource.stat status code will be set to:
     *
     * - timeout {Event} {@link XHR_STATUS_TIMEOUT}
     * - error {Event} {@link XHR_STATUS_ERROR}
     * - abort {Event} {@link XHR_STATUS_ABORT}
     *
     * @param {string} method HTTP request method
     * @param {string} url URL to request on
     * @param {boolean} [async] If `true` will setup the EventListeners for XHR events otherwise will set the resource
     * to synchronous. If `true` or `undefined` will be automatically set to asynchronous
     *
     * @memberof ProxyXHRImplementation
     */
    BOOMR.proxy_XMLHttpRequest = function() {
      var req,
          resource = { timing: {}, initiator: "xhr" },
          orig_open, orig_send,
          opened = false,
          excluded = false;

      req = new BOOMR.orig_XMLHttpRequest();

      orig_open = req.open;
      orig_send = req.send;

      req.open = function(method, url, async) {
        a.href = url;

        if (impl.xhrExcludeFilter(a)) {
          // this xhr should be excluded from instrumentation
          excluded = true;
          debugLog("Exclude found for resource: " + a.href + " Skipping XHR instrumentation!");

          // call the original open method
          return orig_open.apply(req, arguments);
        }

        excluded = false;

        // Default value of async is true
        if (typeof async === "undefined") {
          async = true;
        }

        BOOMR.fireEvent("xhr_init", "xhr");

        /**
         * Setup an {EventListener} for Event @param{ename}. This function will
         * make sure the timestamp for the resources request is set and calls
         * loadFinished should the resource have finished.
         *
         * See {@link open()} for it's usage
         *
         * @param ename {String} Eventname to listen on via addEventListener
         * @param stat {String} if that {@link ename} is reached set this
         * as the status of the resource
         *
         * @memberof ProxyXHRImplementation
         */
        function addListener(ename, stat) {
          req.addEventListener(
            ename,
            function() {
              if (ename === "readystatechange") {
                resource.timing[readyStateMap[req.readyState]] = BOOMR.now();

                // Listen here as well, as DOM changes might happen on other listeners
                // of readyState = 4 (complete), and we want to make sure we've
                // started the addEvent() if so.  Only listen if the status is non-zero,
                // meaning the request wasn't aborted.  Aborted requests will fire the
                // next handler.
                if (req.readyState === 4 && req.status !== 0) {
                  if (req.responseURL !== resource.url) {
                    resource.responseUrl = req.responseURL;
                  }

                  if (req.status < 200 || req.status >= 400) {
                    // put the HTTP error code on the resource if it's not a success
                    resource.status = req.status;
                  }

                  if (impl.captureXhrRequestResponse) {
                    resource.response = {
                      text: (req.responseType === "" || req.responseType === "text") ? req.responseText : null,
                      xml: (req.responseType === "" || req.responseType === "document") ? req.responseXML : null,
                      raw: req.response,
                      json: req.responseJSON
                    };

                    //
                    // Work around browser bugs where our Boomerang frame's Object is not equal
                    // to the main frame's Object.  This affects "isPlainObj()"-like checks that
                    // validate the .constructor is equal to the main frame's Object.
                    // e.g.
                    // https://github.com/facebook/immutable-js/blob/master/src/utils/isPlainObj.js
                    // This seems to mostly affect Safari 11.1.
                    //
                    if (req.response &&
                        req.response.constructor &&
                        req.response.constructor === BOOMR.boomerang_frame.Object &&
                        BOOMR.boomerang_frame.Object !== w.Object) {
                      try {
                        // try to switch the constructor to the main window
                        req.response.constructor = w.Object;
                      }
                      catch (e) {
                        // NOP
                      }
                    }
                  }

                  impl.loadFinished(resource);
                }
                else if (req.readyState === 0 && typeof resource.timing.open === "number") {
                  // something called .abort() after the request was started
                  if (req.responseURL !== resource.url) {
                    resource.responseUrl = req.responseURL;
                  }

                  resource.status = XHR_STATUS_ABORT;
                  impl.loadFinished(resource);
                }
              }
              else {
                if (req.responseURL !== resource.url) {
                  resource.responseUrl = req.responseURL;
                }

                // load, timeout, error, abort
                if (ename === "load") {
                  if (req.status !== 0 && (req.status < 200 || req.status >= 400)) {
                    // put the HTTP error code on the resource if it's not a success
                    resource.status = req.status;
                  }
                }
                else {
                  // this is a timeout/error/abort, so add the status code
                  resource.status = (typeof stat === "undefined" ? req.status : stat);
                }

                impl.loadFinished(resource);
              }
            },
            false
          );
        }

        // .open() can be called multiple times (before .send()) - just make
        // sure that we don't track this as a new request, or add additional
        // event listeners
        if (!opened) {
          if (async) {
            addListener("readystatechange");
          }

          addListener("load");
          addListener("timeout", XHR_STATUS_TIMEOUT);
          addListener("error",   XHR_STATUS_ERROR);
          addListener("abort",   XHR_STATUS_ABORT);
        }

        resource.url = a.href;
        resource.method = method;
        resource.type = "xhr";

        // reset any statuses from previous calls to .open()
        delete resource.status;

        if (!async) {
          resource.synchronous = true;
        }

        // note we've called .open
        opened = true;

        // call the original open method
        try {
          return orig_open.apply(req, arguments);
        }
        catch (e) {
          // if there was an exception during .open(), .send() won't work either,
          // so let's fire loadFinished now
          resource.status = XHR_STATUS_OPEN_EXCEPTION;
          impl.loadFinished(resource);

          // rethrow the native method's exception
          throw e;
        }
      };

      /**
       * Mark requestStart timestamp and start the request unless the resource
       * has already been marked as having an error code or a result to itself.
       *
       * @returns {object} The data normal XHR.send() would return
       *
       * @memberof ProxyXHRImplementation
       */
      req.send = function(data) {
        if (excluded) {
          // this xhr is excluded from instrumentation, call the original send method
          return orig_send.apply(req, arguments);
        }

        if (impl.captureXhrRequestResponse) {
          req.resource.requestPayload = data;
        }

        BOOMR.fireEvent("xhr_send", req);

        handler.addEvent(resource);

        if (!resource.timing.requestStart) {
          resource.timing.requestStart = BOOMR.now();
        }

        // call the original send method unless there was an error
        // during .open
        if (typeof resource.status === "undefined" ||
            resource.status !== XHR_STATUS_OPEN_EXCEPTION) {
          return orig_send.apply(req, arguments);
        }
      };

      req.resource = resource;

      return req;
    };

    BOOMR.proxy_XMLHttpRequest.UNSENT = 0;
    BOOMR.proxy_XMLHttpRequest.OPENED = 1;
    BOOMR.proxy_XMLHttpRequest.HEADERS_RECEIVED = 2;
    BOOMR.proxy_XMLHttpRequest.LOADING = 3;
    BOOMR.proxy_XMLHttpRequest.DONE = 4;

    // set our proxy's prototype to the original XHR prototype, in case anyone
    // is using it to save state
    BOOMR.proxy_XMLHttpRequest.prototype = BOOMR.orig_XMLHttpRequest.prototype;

    // Overwrite window.XMLHttpRequest, ensuring the original is swapped back in
    // if the Boomerang IFRAME is unloaded.  uninstrumentXHR() may also
    // be used to swap the original back in.
    BOOMR.utils.overwriteNative(w, "XMLHttpRequest", BOOMR.proxy_XMLHttpRequest);
    BOOMR.wrapped_XMLHttpRequest = true;
  }

  /**
   * Put original XMLHttpRequest Configuration back into place
   */
  function uninstrumentXHR() {
    if (BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest !== w.XMLHttpRequest) {
      w.XMLHttpRequest = BOOMR.orig_XMLHttpRequest;

      BOOMR.wrapped_XMLHttpRequest = false;
    }
  }

  /**
   * Sends an XHR resource
   */
  function sendResource(resource) {
    resource.initiator = "xhr";

    BOOMR.responseEnd(resource);
  }

  /**
   * Container for AutoXHR plugin state
   *
   * @property {string[]} spaBackendResources Resources to count as Back-End during a SPA nav
   * @property {XhrFilterObject[]} xhrExcludeFilters Array of {@link XhrFilterObject} that is used
   *   to apply filters on XHR Requests
   * @property {DomFilterObject[]} domExcludeFilters Array of {@link DomFilterObject} that is used
   *   to apply filters on DOM elements
   * @property {boolean} initialized Set to true after initialization
   *
   * {@link BOOMR.plugins.AutoXHR#init}
   */
  impl = {
    /**
     * Resources to count as Back-End during a SPA nav
     * @type {string[]}
     */
    spaBackEndResources: SPA_RESOURCES_BACK_END,

    /**
     * Whether or not to always send a beacon for each individual XHR.
     *
     * * When true, all XHRs forcefully send a beacon.
     * * When false, no XHRs forcefully send a beacon.
     * * When a function, it is called with the XHR's URL.  If it returns true, the XHR will forcefully send a beacon.
     * * When an array of strings or RegExps, XHRs matching the domain or regular expression
     *   will forcefully send a beacon.
     * @type {boolean|function|string[]|RegExp[]}
     */
    alwaysSendXhr: false,

    /**
     * Array of {@link XhrFilterObject} that is used to apply filters on XHR Requests
     * @type {function[]}
     */
    xhrExcludeFilters: [],

    /**
     * Array of {@link DomFilterObject} that is used to apply filters on DOM elements
     * @type {function[]}
     */
    domExcludeFilters: [],

    /**
     * Whether or not the AutoXHR plugin has been initialized
     * @type {boolean}
     */
    initialized: false,

    /**
     * Whether or not to capture an XHR's request and response bodies on for the {@link event:BOOMR#xhr_load xhr_load}
     * event.
     * @type {boolean}
     */
    captureXhrRequestResponse: false,

    /**
     * Whether or not the AutoXHR plugin is in SPA mode.
     * @type {boolean}
     */
    singlePageApp: false,

    /**
     * Whether or not to measure SPA start time's from the most recent click.
     * @type {boolean}
     */
    spaStartFromClick: false,

    /**
     * Whether or not to measuring XHRs is enabled.
     * @type {boolean}
     */
    autoXhrEnabled: false,

    /**
     * Whether or not to measure the Fetch API
     * @type {boolean}
     */
    monitorFetch: false,

    /**
     * If the fetch response's bodyUsed flag is false,
     * we'll wait this amount of ms before checking RT for an entry. Setting to 0 will disable this feature
     * @type {number}
     */
    fetchBodyUsedWait: FETCH_BODY_USED_WAIT_DEFAULT,

    /**
     * Timeout for Single Page Applications after the final
     * resource fetch has completed before calling the SPA navigation complete. Default is 1000ms.
     * @type {number}
     */
    spaIdleTimeout: SPA_TIMEOUT,

    /**
     * Timeout for XHRs after final resource fetch has completed
     * before calling the XHR complete.  Default is 50ms.
     * @type {number}
     */
    xhrIdleTimeout: CLICK_XHR_TIMEOUT,

    /**
     * Whether or not a XHR beacon will only be triggered if there were DOM changes.
     * @type {boolean}
     */
    xhrRequireChanges: true,

    /**
     * Filter function iterating over all available {@link XhrFilterObject}s.
     *
     * If any filter returns true, the XHR will *not* be instrumented.
     *
     * @param {HTMLAnchorElement} anchor - HTMLAnchorElement node created with
     * the XHRs URL as `href` to evaluate by {@link XhrFilterObject}s and passed
     * to {@link XhrFilterObject#cb} callbacks.
     *
     * NOTE: The anchor needs to be created from the host document
     * (ie. `BOOMR.window.document`) to enable us to resolve relative URLs to
     * a full valid path and BASE HREF mechanics can take effect.
     *
     * @return {boolean} True if the XHR should not be instrumented.
     */
    xhrExcludeFilter: function(anchor) {
      var idx, ret, ctx;

      // If anchor is null we just throw it out period
      if (!anchor || !anchor.href) {
        return false;
      }

      for (idx = 0; idx < impl.xhrExcludeFilters.length; idx++) {
        if (typeof impl.xhrExcludeFilters[idx].cb === "function") {
          ctx = impl.xhrExcludeFilters[idx].ctx;

          try {
            ret = impl.xhrExcludeFilters[idx].cb.call(ctx, anchor);

            if (ret) {
              /* BEGIN_DEBUG */
              debugLog("XHR exclude filter " +
                impl.xhrExcludeFilters[idx].name + " matched for URL: " +
                anchor.href);
              /* END_DEBUG */

              return true;
            }
          }
          catch (exception) {
            BOOMR.addError(exception, "BOOMR.plugins.AutoXHR.impl.xhrExcludeFilter()");
          }
        }
      }

      return false;
    },

    /**
     * Filter function iterating over all available {@link DomFilterObject}s.
     *
     * @param {HTMLElement} elem - HTMLElement to review for instrumentation.
     *
     * If any filter returns true, the DOM element will *not* be instrumented.
     *
     * @return {boolean} True if the DOM element should not be instrumented.
     */
    domExcludeFilter: function(elem) {
      var idx, ret, ctx;

      for (idx = 0; idx < impl.domExcludeFilters.length; idx++) {
        if (typeof impl.domExcludeFilters[idx].cb === "function") {
          ctx = impl.domExcludeFilters[idx].ctx;

          if (impl.domExcludeFilters[idx].name) {
            debugLog("Running DOM filter: " + impl.domExcludeFilters[idx].name);
          }

          try {
            ret = impl.domExcludeFilters[idx].cb.call(ctx, elem);

            if (ret) {
              /* BEGIN_DEBUG */
              debugLog("Found matching DOM filter at: " +
                impl.domExcludeFilters[idx].name);
              /* END_DEBUG */

              return true;
            }
          }
          catch (exception) {
            BOOMR.addError(exception, "BOOMR.plugins.AutoXHR.impl.domExcludeFilter()");
          }
        }
      }

      debugLog("XHR exclude filters did not match for URL: " + elem.href);

      return false;
    },

    /**
     * Mark this as the time load ended via resources loadEventEnd property, if this resource has been added
     * to the {@link MutationHandler} already notify that the resource has finished.
     * Otherwise add this call to the lise of Events that occured.
     *
     * @param {object} resource Resource
     *
     * @memberof BOOMR.plugins.AutoXHR
     */
    loadFinished: function(resource, now) {
      var entry, navSt,
          useRT = false,
          entryStartTime, entryResponseEnd, p;

      now = now || BOOMR.now();

      // if we already finished via readystatechange or an error event,
      // don't do work again
      if (resource.timing.loadEventEnd) {
        return;
      }

      // fire an event for anyone listening
      if (resource.status) {
        BOOMR.fireEvent("xhr_error", resource);
      }

      // set the loadEventEnd timestamp to when this callback fired
      resource.timing.loadEventEnd = now;

      p = BOOMR.getPerformance();

      if (p && p.timing) {
        navSt = p.timing.navigationStart;

        // if ResourceTiming is available, fix-up the .timings with ResourceTiming
        // data, as it will be more accurate
        entry = BOOMR.getResourceTiming(resource.url,
          function(rt1, rt2) {
            // sort by desc responseEnd so that we'll get the one that finished closest to now
            return rt1.responseEnd - rt2.responseEnd;
          },
          function(rt) {
            // filter out requests that started before our tracked resource.
            // We set `requestStart` right before calling the original xhr.send or fetch call.
            // If the ResourceTiming startTime is more than 2ms earlier
            // than when we thought the XHR/fetch started then this is probably
            // an entry for a different resource.
            // The RT entry's startTime needs to be converted to an Epoch
            return ((Math.ceil(navSt + rt.startTime + 2) >= resource.timing.requestStart)) &&
                (rt.responseEnd !== 0);
          }
        );

        if (entry) {
          // convert the start time to Epoch
          entryStartTime = Math.floor(navSt + entry.startTime);

          // set responseEnd, convert to Epoch
          entryResponseEnd = Math.floor(navSt + entry.responseEnd);

          // sanity check to see if the entry should be used for this resource
          if (entryResponseEnd <= BOOMR.now()) {
            resource.timing.responseEnd = entryResponseEnd;

            // make sure loadEventEnd is greater or equal to the RT
            // entry's responseEnd.
            // This will happen when fetch API is used without consuming the
            // response body
            if (resource.timing.loadEventEnd < entryResponseEnd) {
              resource.timing.loadEventEnd = entryResponseEnd;
            }

            // use the startTime from ResourceTiming instead (if not already set from Click)
            if (!resource.fromClick || !resource.timing.requestStart) {
              resource.timing.requestStart = entryStartTime;
            }

            // also track it as the fetchStart time
            resource.timing.fetchStart = entryStartTime;

            // use responseStart if it's valid
            if (entry.responseStart !== 0) {
              resource.timing.responseStart = Math.floor(navSt + entry.responseStart);
            }

            // save the entry for later use
            resource.restiming = entry;
          }
        }
      }

      // if there's an active XHR event happening, and alwaysSendXhr is true, make sure this
      // XHR goes out on its own beacon too
      if (resource.node && matchesAlwaysSendXhr(resource.url, impl.alwaysSendXhr)) {
        handler.sendResource(resource);
      }

      if (resource.index >= 0) {
        handler.monitorMO(resource.index);

        // fire the load_finished handler for the corresponding event.
        handler.load_finished(resource.index, resource.timing.responseEnd);
      }
    }
  };

  BOOMR.plugins.AutoXHR = {
    /**
     * This plugin is always complete (ready to send a beacon)
     *
     * @returns {boolean} `true`
     * @memberof BOOMR.plugins.AutoXHR
     */
    is_complete: function() {
      return true;
    },

    /**
     * Initializes the plugin.
     *
     * @param {object} config Configuration
     * @param {boolean} [config.instrument_xhr] Whether or not to instrument XHR
     * @param {string[]} [config.AutoXHR.spaBackEndResources] Default resources to count as
     * Back-End during a SPA nav
     * @param {boolean} [config.AutoXHR.monitorFetch] Whether or not to instrument fetch()
     * @param {number} [config.AutoXHR.fetchBodyUsedWait] If the fetch response's bodyUsed flag is false,
     * we'll wait this amount of ms before checking RT for an entry. Setting to 0 will disable this feature
     * @param {boolean|string[]|RegExp[]|function[]} [config.AutoXHR.alwaysSendXhr] Whether or not to send XHR
     * beacons for every XHR.
     * @param {boolean} [config.captureXhrRequestResponse] Whether or not to capture an XHR's
     * request and response bodies on for the {@link event:BOOMR#xhr_load xhr_load} event.
     * @param {number} [config.AutoXHR.spaIdleTimeout=1000] Timeout for Single Page Applications after the final
     * resource fetch has completed before calling the SPA navigation complete. Default is 1000ms.
     * @param {number} [config.AutoXHR.xhrIdleTimeout=50] Timeout for XHRs after final resource fetch has completed
     * before calling the XHR complete.  Default is 50ms.
     * @param {boolean} [config.AutoXHR.xhrRequireChanges=true] Whether or not a XHR beacon will only be triggered
     * if there were DOM changes.
     * @param {boolean} [config.AutoXHR.spaStartFromClick=false] In Single Page Apps, start tracking
     * the SPA Soft Navigation from any preceeding clicks.  If false, will start from the most recent pushState.
     *
     * @returns {@link BOOMR.plugins.AutoXHR} The AutoXHR plugin for chaining
     * @memberof BOOMR.plugins.AutoXHR
     */
    init: function(config) {
      var i, idx;

      d = w.document;

      // if we don't have window, abort
      if (!w || !d) {
        return;
      }

      a = d.createElement("A");

      // gather config and config overrides
      BOOMR.utils.pluginConfig(impl, config, "AutoXHR",
        ["spaBackEndResources", "alwaysSendXhr", "monitorFetch", "fetchBodyUsedWait",
          "spaIdleTimeout", "xhrIdleTimeout", "xhrRequireChanges", "spaStartFromClick"]);

      // Run one-time initializers
      if (!impl.initialized) {
        BOOMR.instrumentXHR = instrumentXHR;
        BOOMR.uninstrumentXHR = uninstrumentXHR;
        BOOMR.instrumentFetch = instrumentFetch;
        BOOMR.uninstrumentFetch = uninstrumentFetch;

        // Ensure we're only once adding the shouldExcludeXhr
        this.addExcludeFilter(shouldExcludeXhr, null, "shouldExcludeXhr");

        impl.initialized = true;
      }

      //
      // Add XHR filters from config
      // NOTE via config it's just called 'excudeFilters' (for compat), while in the code it's always
      // 'xhrExcludeFilters' to differentiate itself from domExcludeFilters
      //
      if (config && config.AutoXHR && config.AutoXHR.excludeFilters && config.AutoXHR.excludeFilters.length > 0) {
        for (idx = 0; idx < config.AutoXHR.excludeFilters.length; idx++) {
          if (typeof config.AutoXHR.excludeFilters[idx] === "function") {
            impl.xhrExcludeFilters.push({
              cb: config.AutoXHR.excludeFilters[idx],
              ctx: this,
              name: "unknown XHR filter"
            });
          }
          else {
            impl.xhrExcludeFilters.push(config.AutoXHR.excludeFilters[idx]);
          }
        }
      }

      // Add DOM filters from config
      if (config && config.AutoXHR && config.AutoXHR.domExcludeFilters && config.AutoXHR.domExcludeFilters.length > 0) {
        for (idx = 0; idx < config.AutoXHR.domExcludeFilters.length; idx++) {
          if (typeof config.AutoXHR.domExcludeFilters[idx] === "function") {
            impl.domExcludeFilters.push({
              cb: config.AutoXHR.domExcludeFilters[idx],
              ctx: this,
              name: "unknown DOM filter"
            });
          }
          else {
            impl.domExcludeFilters.push(config.AutoXHR.domExcludeFilters[idx]);
          }
        }
      }

      // check if XHR should be enabled (once enabled, always enabled)
      impl.autoXhrEnabled = impl.autoXhrEnabled || config.instrument_xhr;

      // check to see if any of the SPAs were enabled
      impl.singlePageApp = impl.singlePageApp || (BOOMR.plugins.SPA && BOOMR.plugins.SPA.isSinglePageApp(config));

      // Whether or not to always send XHRs.  If a SPA is enabled, this means it will
      // send XHRs during the hard and soft navs.  If enabled, it will also disable
      // listening for MutationObserver events after an XHR is complete.
      if (impl.alwaysSendXhr && impl.autoXhrEnabled && BOOMR.xhr && typeof BOOMR.xhr.stop === "function") {
        function sendXhrs(resources) {
          if (resources.length) {
            for (i = 0; i < resources.length; i++) {
              sendResource(resources[i]);
            }
          }
          else {
            // single resource
            sendResource(resources);
          }
        };

        var resources = BOOMR.xhr.stop(sendXhrs);

        if (resources && resources.length) {
          BOOMR.setImmediate(sendXhrs, resources);
        }
      }

      // only turn on/off instrumentation if this config request is specifying a change
      if (typeof config.instrument_xhr !== "undefined") {
        if (impl.singlePageApp) {
          if (!impl.alwaysSendXhr) {
            // Disable auto-xhr until the SPA has fired its first beacon.  The
            // plugin will re-enable after it's ready.
            impl.autoXhrEnabled = false;
          }

          if (impl.autoXhrEnabled) {
            BOOMR.instrumentXHR();
            BOOMR.instrumentFetch();
          }
        }
        else {
          if (impl.autoXhrEnabled) {
            BOOMR.instrumentXHR();
            BOOMR.instrumentFetch();
          }
          else if (impl.autoXhrEnabled === false) {
            BOOMR.uninstrumentXHR();
            BOOMR.uninstrumentFetch();
          }
        }
      }

      BOOMR.registerEvent("xhr_error");
    },

    /**
     * Gets the {@link MutationHandler}
     *
     * @returns {MutationHandler} Handler
     * @memberof BOOMR.plugins.AutoXHR
     */
    getMutationHandler: function() {
      return handler;
    },

    getPathname: getPathName,

    /**
     * Enables AutoXHR if not already enabled.
     *
     * @memberof BOOMR.plugins.AutoXHR
     */
    enableAutoXhr: function() {
      if (!impl.autoXhrEnabled) {
        BOOMR.instrumentXHR();
        BOOMR.instrumentFetch();
      }

      impl.autoXhrEnabled = true;
    },

    /**
     * A callback with a HTML element.
     * @callback htmlElementCallback
     * @param {HTMLAnchorElement} elem HTML element
     * @memberof BOOMR.plugins.AutoXHR
     */

    /**
     * Add a XHR filter function to the list of functions to run to validate if an
     * XHR should be instrumented.
     *
     * @example
     * BOOMR.plugins.AutoXHR.addExcludeFilter(function(anchor) {
     *   var m = anchor.href.match(/some-page\.html/g);
     *
     *   // If matching flag to not instrument
     *   if (m && m.length > 0) {
     *     return true;
     *   }
     *   return false;
     * }, null, "exampleFilter");
     * @param {BOOMR.plugins.AutoXHR.htmlElementCallback} cb Callback to run to validate filtering of an XHR Request
     * @param {Object} ctx Context to run {@param cb} in
     * @param {string} [name] Optional name for the filter, called out when running exclude
     *   filters for debugging purposes
     *
     * @memberof BOOMR.plugins.AutoXHR
     */
    addExcludeFilter: function(cb, ctx, name) {
      impl.xhrExcludeFilters.push({cb: cb, ctx: ctx, name: name});
    },

    /**
     * Add a DOM filter function to the list of functions to run to validate if an
     * DOM element should be instrumented.
     *
     * @example
     * BOOMR.plugins.AutoXHR.addDomExcludeFilter(function(elem) {
     *   return elem.id === "ignore";
     * }, null, "exampleFilter");
     * @param {BOOMR.plugins.AutoXHR.htmlElementCallback} cb Callback to run to validate filtering of an XHR Request
     * @param {Object} ctx Context to run {@param cb} in
     * @param {string} [name] Optional name for the filter, called out when running exclude
     *   filters for debugging purposes
     *
     * @memberof BOOMR.plugins.AutoXHR
     */
    addDomExcludeFilter: function(cb, ctx, name) {
      impl.domExcludeFilters.push({cb: cb, ctx: ctx, name: name});
    },

    /**
     * Enables or disables XHR request and response capturing for
     * the {@link event:BOOMR#xhr_load xhr_load} event.
     *
     * @param {boolean} enabled Whether or not to enable capturing
     */
    setXhrRequestResponseCapturing: function(enabled) {
      impl.captureXhrRequestResponse = enabled;
    }

    /* BEGIN_DEBUG */,
    matchesAlwaysSendXhr: matchesAlwaysSendXhr
    /* END_DEBUG */
  };

  /**
   * Hook called once a resource is found to be loaded and timers have been set.
   * @callback ResourceOnComplete
   * @memberof BOOMR.plugins.AutoXHR
   */

  /**
   * @typedef {Object} Resource
   * @memberof BOOMR.plugins.AutoXHR
   *
   * @desc
   * Resource objects define properties of a page element or resource monitored by {@link AutoXHR}.
   *
   * @property {string} initiator Type of source that initiated the resource to be fetched:
   * `click`, `xhr` or SPA initiated
   * @property {string} url Path to the resource fetched from either the HTMLElement or XHR request that triggered it
   * @property {object} timing Resource timing information gathered from internal timers or ResourceTiming if supported
   * @property {ResourceTiming} timing Object containing start and end timings of the resource if set
   * @property {ResourceOnComplete} [onComplete] Called once the resource has been fetched
   */

  /**
   * An event on a page instrumented by {@link MutationHandler} and monitored by AutoXHR
   *
   * @typedef PendingEvent
   *
   * @property {string} type The type of event that we are watching (`xhr`, `click`,
   *   [SPAs]{@link BOOMR.constants.BEACON_TYPE_SPAS})
   * @property {number} nodes_to_wait Number of nodes to wait for before event completes
   * @property {number} total_nodes Total number of resources
   * @property {Resource} resource The resource this event is attached to
   * @property {boolean} complete `true` if event completed `false` if not
   * @property {Resource[]} [resources] multiple resources that are attached to this event
   *
   * @memberof BOOMR.plugins.AutoXHR
   */

  /**
   * Timestamps for start of a request and end of loading
   *
   * @typedef ResourceTiming
   *
   * @property {TimeStamp} loadEventEnd Timestamp when the resource arrived in the browser
   * @property {TimeStamp} requestStart High resolution timestamp when the resource was started to be loaded
   *
   * @memberof BOOMR.plugins.AutoXHR
   */

  /**
   * XHR filter object with data on the callback, context and name.
   *
   * @typedef XhrFilterObject
   *
   * @property {BOOMR.plugins.AutoXHR.htmlElementCallback} cb Callback
   * @property {Object} ctx Execution context to use when running `cb`
   * @property {string} [name] Name of the filter used for logging and debugging purposes
   *
   * @memberof BOOMR.plugins.AutoXHR
   */

  /**
   * DOM filter object with data on the callback, context and name.
   *
   * @typedef DomFilterObject
   *
   * @property {BOOMR.plugins.AutoXHR.htmlElementCallback} cb Callback
   * @property {Object} ctx Execution context to use when running `cb`
   * @property {string} [name] Name of the filter used for logging and debugging purposes
   *
   * @memberof BOOMR.plugins.AutoXHR
   */
})();
