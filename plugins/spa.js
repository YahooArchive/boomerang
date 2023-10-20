/**
 * Enables Single Page App (SPA) performance monitoring.
 *
 * **Note**: The `SPA` plugin requires the {@link BOOMR.plugins.AutoXHR} plugin
 * to be loaded before `SPA`, and one of the following SPA plugins to work:
 *
 * * {@link BOOMR.plugins.Angular}
 * * {@link BOOMR.plugins.Backbone}
 * * {@link BOOMR.plugins.Ember}
 * * {@link BOOMR.plugins.History} (React and all other SPA support)
 *
 * You also need to disable {@link BOOMR.init|autorun} when enabling SPA support.
 *
 * If you are not using a SPA framework but rely mostly on `XMLHttpRequests` to
 * build your site, you might be able to skip the SPA plugins and just enable
 * the {@link BOOMR.plugins.AutoXHR} plugin to measure your site.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Approach
 *
 * Boomerang monitors Single Page App (SPA) navigations differently than how it
 * monitors navigations on traditional websites.
 *
 * On traditional websites, the browser completes a full navigation for every page.
 * During this navigation, the browser requests the page's HTML, JavaScript,
 * CSS, etc., from the server, and builds the page from these components. Boomerang
 * monitors this entire process.
 *
 * On SPA websites, only the first page that the visitor loads is a full
 * navigation. All subsequent navigations are handled by the SPA framework
 * itself (i.e. AngularJS), where they dynamically pull in the content they
 * need to render the new page. This is done without executing a full navigation
 * from the browser's point of view.
 *
 * Boomerang was designed for traditional websites, where a full navigation
 * occurs on each page load. During the navigation, Boomerang tracks the
 * performance characteristics of the entire page load experience. However, for
 * SPA websites, only the first page triggers a full navigation. Thus, without
 * any additional help, Boomerang will not track any subsequent interactions
 * on SPA websites.
 *
 * To give visibility into SPA website navigations, there are several Boomerang
 * plugins available for SPA frameworks, such as AngularJS, Ember.js and Backbone.js.
 * When these plugins are enabled, Boomerang is able to track all of the SPA
 * navigations beyond the first, initial navigation.
 *
 * To do so, the Boomerang SPA plugins listen for several life cycle events from
 * the framework, such as AngularJS's `$routeChangeStart`. Once it gets notified
 * of these events, the Boomerang SPA plugins start monitoring the page's markup
 * (DOM) for changes. If any of these changes trigger a download, such as a
 * XHR, image, CSS, or JavaScript, then the Boomerang SPA plugins monitor those
 * resources as well. Only once all of these new resources have been fetched do
 * the Boomerang SPA plugins consider the SPA navigation complete.
 *
 * For a further explanation of the challenges of measuring SPAs, see our
 * {@link https://www.slideshare.net/nicjansma/measuring-the-performance-of-single-page-applications|slides}
 * or our {@link https://www.youtube.com/watch?v=CYEYtQPofhQ&t=10s|talk}.
 *
 * ## Hard and Soft Navigations
 *
 * * A **SPA Hard Navigation** is always the first navigation to the site, plus
 *   any of the work required to build the initial view.
 *    * The Hard Navigation will track at least the length of `onload`, but may also include the additional
 *      time required to load the framework (for example, Angular) and the first view.
 *    * A SPA site will only have a single SPA Hard Navigation, no "Page Load" beacons.
 *    * The `http.initiator` type is `spa_hard`
 * * A **SPA Soft Navigation** is any navigation after the Hard Navigation.
 *    * A soft navigation is an "in-page" navigation where the view changes, but
 *      the browser does not actually fully navigate.
 *    * A SPA site could have zero through many Soft Navigations
 *    * The `http.initiator` type is `spa`
 *
 * ## Navigation Timestamps
 *
 * ### Hard Navigations
 *
 * The length of a Hard Navigation is calculated from the beginning of the browser
 * navigation (e.g. `navigationStart` from NavigationTiming) through when the
 * last critical resource has been fetched for the page.
 *
 * Critical resources include Images, IFRAMEs, CSS and Scripts.
 *
 * ### Soft Navigations
 *
 * The length of a Soft Navigation is calculated from the beginning of the route
 * change event (e.g. when the user clicked somewhere to change the view) through
 * when the last critical resource has been fetched for the page.
 *
 * ## Front-End vs. Back-End Time
 *
 * For SPA navigations, the _Back End_ time (`t_resp`) is calculated as any period
 * where a XHR or Script tag was being fetched.
 *
 * The _Front End_ time (`t_page`) is calculated by taking the total SPA Page
 * Load time (`t_done`) minus _Back End_ time (`t_resp`).
 *
 * ## Beacon Parameters
 *
 * * `http.initiator`
 *     * `spa_hard` for Hard Navigations
 *     * `spa` for Soft Navigations
 *
 * @class BOOMR.plugins.SPA
 */
(function() {
  var hooked = false,
      initialized = false,
      initialRouteChangeStarted = false,
      initialRouteChangeCompleted = false,
      autoXhrEnabled = false,
      firstSpaNav = true,
      routeFilter = false,
      routeChangeWaitFilter = false,
      routeChangeWaitFilterHardNavs = false,
      disableHardNav = false,
      supported = [],
      latestResource,
      waitingOnHardMissedComplete = false;

  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  if (BOOMR.plugins.SPA || !BOOMR.plugins.AutoXHR) {
    return;
  }

  /* BEGIN_DEBUG */
  /**
   * Debug logging for this plugin
   *
   * @param {string} msg Message
   */
  function debugLog(msg) {
    BOOMR.debug(msg, "SPA");
  }
  /* END_DEBUG */

  var impl = {
    /**
     * Called after a SPA Hard navigation that missed the route change
     * completes.
     *
     * We may want to fix-up the timings of the SPA navigation if there was
     * any other activity after onload.
     *
     * If there was not activity after onload, using the timings for
     * onload from NavigationTiming.
     *
     * If there was activity after onload, use the end time of the latest
     * resource.
     *
     * @param {BOOMR.plugins.AutoXHR.Resource} resource Resource
     */
    spaHardMissedOnComplete: function(resource) {
      var p,
          navigationStart = (BOOMR.plugins.RT && BOOMR.plugins.RT.navigationStart()),
          ev,
          mh = BOOMR.plugins.AutoXHR.getMutationHandler();

      waitingOnHardMissedComplete = false;

      // note that we missed the route change on the beacon for debugging
      BOOMR.addVar("spa.missed", "1", true);

      // ensure t_done is the time we've specified
      if (BOOMR.plugins.RT) {
        BOOMR.plugins.RT.clearTimer("t_done");
      }

      // always use the start time of navigationStart
      resource.timing.requestStart = navigationStart;

      ev = mh.pending_events[resource.index];

      if (!ev || ev.total_nodes === 0) {
        // No other resources (xhrs or mutations) were detected, so set the end time
        // to NavigationTiming's page loadEventEnd if available (instead of 'now')
        p = BOOMR.getPerformance();

        if (p &&
            p.timing &&
            p.timing.navigationStart &&
            p.timing.loadEventEnd &&
            // loadEventEnd may have been set by a wait filter
            typeof resource.timing.loadEventEnd === "undefined") {
          resource.timing.loadEventEnd = p.timing.loadEventEnd;
        }
      }
    },

    /**
     * Fired on a non-spa page load
     */
    pageReady: function() {
      // a non-spa page load fired, disableHardNav might be enabled
      initialRouteChangeCompleted = true;
    }
  };

  //
  // Exports
  //
  BOOMR.plugins.SPA = {
    /**
     * Determines if the plugin is complete
     *
     * @returns {boolean} True if the plugin is complete
     *
     * @memberof BOOMR.plugins.SPA
     */
    is_complete: function(vars) {
      // allow error and early beacons to go through even if we're not complete
      return !waitingOnHardMissedComplete ||
        (vars && (vars["http.initiator"] === "error" || typeof vars.early !== "undefined"));
    },

    /**
     * Called to initialize the plugin via BOOMR.init()
     *
     * @param {object} config Configuration
     *
     * @memberof BOOMR.plugins.SPA
     */
    init: function(config) {
      if (config && config.instrument_xhr) {
        autoXhrEnabled = config.instrument_xhr;

        // if AutoXHR is enabled, and we've already had
        // a route change, make sure to turn AutoXHR back on
        if (initialRouteChangeStarted && autoXhrEnabled) {
          BOOMR.plugins.AutoXHR.enableAutoXhr();
        }
      }

      if (initialized) {
        return;
      }

      initialized = true;
      BOOMR.subscribe("page_ready", impl.pageReady, null, impl);
    },

    /**
     * Registers a framework with the SPA plugin
     *
     * @param {string} pluginName Plugin name
     *
     * @memberof BOOMR.plugins.SPA
     */
    register: function(pluginName) {
      supported.push(pluginName);
    },

    /**
     * Gets a list of supported SPA frameworks
     *
     * @returns {string[]} List of supported frameworks
     *
     * @memberof BOOMR.plugins.SPA
     */
    supported_frameworks: function() {
      return supported;
    },

    /**
     * Fired when onload happens (or immediately if onload has already fired)
     * to monitor for additional resources for a SPA Hard navigation
     *
     * @memberof BOOMR.plugins.SPA
     */
    onLoadSpaHardMissed: function() {
      if (initialRouteChangeStarted) {
        // we were told the History event was missed, but it happened anyways
        // before onload
        return;
      }

      // We missed the initial route change (we loaded too slowly), so we're too
      // late to monitor for new DOM elements.  Don't hold the initial page load beacon.
      initialRouteChangeCompleted = true;

      if (autoXhrEnabled) {
        // re-enable AutoXHR if it's enabled
        BOOMR.plugins.AutoXHR.enableAutoXhr();
      }

      // ensure the beacon is held until this SPA hard beacon is ready
      waitingOnHardMissedComplete = true;

      if (!disableHardNav) {
        // Trigger a route change
        BOOMR.plugins.SPA.route_change(impl.spaHardMissedOnComplete);
      }
      else {
        waitingOnHardMissedComplete = false;
      }
    },

    /**
     * Callback to let the SPA plugin know whether or not to monitor the current
     * SPA soft route.
     *
     * Any time a route is changed, if set, this callback will be executed
     * with the current framework's route data.
     *
     * If the callback returns `false`, the route will not be monitored.
     *
     * @callback spaRouteFilter
     * @param {object} data Route data
     *
     * @returns {boolean} `true` to monitor the current route
     * @memberof BOOMR.plugins.SPA
     */

    /**
     * Callback to let the SPA plugin know whether or not the end of monitoring
     * of the current SPA soft route should be delayed until {@link BOOMR.plugins.SPA.wait_complete}
     * is called.
     *
     * If the callback returns `false`, the route will be monitored as normal.
     *
     * @callback spaRouteChangeWaitFilter
     * @param {object} data Route data
     *
     * @returns {boolean} `true` to wait until {@link BOOMR.plugins.SPA.wait_complete} is called.
     * @memberof BOOMR.plugins.SPA
     */

    /**
     * Called by a framework when it has hooked into the target SPA
     *
     * @param {boolean} hadRouteChange True if a route change has already fired
     * @param {object} [options] Additional options
     * @param {BOOMR.plugins.SPA.spaRouteFilter} [options.routeFilter] Route filter
     * @param {BOOMR.plugins.SPA.spaRouteChangeWaitFilter} [options.routeChangeWaitFilter] Route change wait filter
     * @param {boolean} [options.routeChangeWaitFilterHardNavs] Whether to apply wait filter on hard navs
     * @param {boolean} [options.disableHardNav] Disable sending SPA hard beacons
     *
     * @returns {@link BOOMR.plugins.SPA} The SPA plugin for chaining
     * @memberof BOOMR.plugins.SPA
     */
    hook: function(hadRouteChange, options) {
      options = options || {};

      debugLog("Hooked");

      // allow to set options each call in case they change

      if (typeof options.routeFilter === "function") {
        routeFilter = options.routeFilter;
      }

      if (typeof options.routeChangeWaitFilter === "function") {
        routeChangeWaitFilter = options.routeChangeWaitFilter;
      }

      if (typeof options.routeChangeWaitFilterHardNavs === "boolean") {
        routeChangeWaitFilterHardNavs = options.routeChangeWaitFilterHardNavs;
      }

      if (options.disableHardNav) {
        disableHardNav = options.disableHardNav;
      }

      if (hooked) {
        return this;
      }

      if (hadRouteChange) {
        // kick off onLoadSpaHardMissed once onload has fired, or immediately
        // if onload has already fired
        BOOMR.attach_page_ready(this.onLoadSpaHardMissed);
      }

      hooked = true;

      return this;
    },

    /**
     * Called by a framework when a route change has started.  The SPA plugin will
     * begin monitoring downloadable resources to measure the SPA soft navigation.
     *
     * @param {function} onComplete Called on completion
     * @param {object[]} routeFilterArgs Route Filter arguments array
     *
     * @memberof BOOMR.plugins.SPA
     */
    route_change: function(onComplete, routeFilterArgs) {
      var now = BOOMR.now();

      debugLog("Route Change");

      var firedEvent = false;
      var initiator = firstSpaNav && !disableHardNav ? "spa_hard" : "spa";

      if (latestResource && latestResource.wait) {
        debugLog("Route change wait filter not complete; not tracking this route");

        return;
      }

      // if we have a routeFilter, see if we want to track this SPA soft route
      if (initiator === "spa" && routeFilter) {
        try {
          if (!routeFilter.apply(null, routeFilterArgs)) {
            debugLog("Route filter returned false; not tracking this route");

            return;
          }
          else {
            debugLog("Route filter returned true; tracking this route");
          }
        }
        catch (e) {
          BOOMR.addError(e, "SPA.route_change.routeFilter");
        }
      }

      // note we've had at least one route change
      initialRouteChangeStarted = true;

      // If this was the first request, use navStart as the begin timestamp.  Otherwise, use
      // "now" as the begin timestamp.
      var navigationStart = (BOOMR.plugins.RT && BOOMR.plugins.RT.navigationStart());
      var requestStart = (firstSpaNav && !initialRouteChangeCompleted) ? navigationStart : now;

      // use the document.URL even though it may be the URL of the previous nav. We will updated
      // it in AutoXHR sendEvent
      var url = BOOMR.window.document.URL;

      // construct the resource we'll be waiting for
      var resource = {
        timing: {
          requestStart: requestStart
        },
        initiator: initiator,
        url: url
      };

      // if route_change was called, we're not the initial SPA nav anymore
      firstSpaNav = false;

      // a new route has started, so the initial one must be completed
      initialRouteChangeCompleted = true;

      // if we haven't completed our initial SPA navigation yet (this is a hard nav), wait
      // for all of the resources to be downloaded
      resource.onComplete = function(onCompleteResource) {
        if (!firedEvent) {
          firedEvent = true;

          // fire a SPA navigation completed event so that other plugins can act on it
          BOOMR.fireEvent("spa_navigation", [resource.timing]);
        }

        if (typeof onComplete === "function") {
          onComplete(onCompleteResource);
        }
      };

      // if we have a routeChangeWaitFilter, make sure AutoXHR waits on the custom event
      // for this SPA soft route
      if ((initiator === "spa" || routeChangeWaitFilterHardNavs) && routeChangeWaitFilter) {
        debugLog("Running route change wait filter");
        try {
          if (routeChangeWaitFilter.apply(null, arguments)) {
            debugLog("Route filter returned true; waiting for complete call");
            resource.wait = true;

            latestResource = resource;
          }
          else {
            debugLog("Route wait filter returned false; not waiting for complete call");
          }
        }
        catch (e) {
          BOOMR.addError(e, "SPA.route_change.routeChangeWaitFilter");
        }
      }

      // start listening for changes
      resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);

      // Fire spa_init event listeners
      BOOMR.fireEvent("spa_init", [
        BOOMR.plugins.SPA.current_spa_nav(),
        url,
        resource.timing]);

      // re-enable AutoXHR if it's enabled
      if (autoXhrEnabled) {
        BOOMR.plugins.AutoXHR.enableAutoXhr();
      }
    },

    /**
     * Called by a framework when the location has changed to the specified URL.
     * This should be called prior to route_change() to use the specified URL.
     *
     * @param {string} url URL
     *
     * @memberof BOOMR.plugins.SPA
     */
    last_location: function(url) {
      lastLocationChange = url;
    },

    /**
     * Determine the current SPA navigation type (`spa` or `spa_hard`)
     *
     * @returns {string} SPA beacon type
     * @memberof BOOMR.plugins.SPA
     */
    current_spa_nav: function() {
      return !initialRouteChangeCompleted ? "spa_hard" : "spa";
    },

    /**
     * Called by the SPA consumer if we have a `routeChangeWaitFilter` and are manually
     * waiting for a custom event. The spa soft navigation will continue waiting for
     * other nodes in progress
     *
     * @memberof BOOMR.plugins.SPA
     */
    wait_complete: function() {
      debugLog("Route change wait filter completed");

      if (latestResource) {
        latestResource.wait = false;

        if (latestResource.waitComplete) {
          debugLog("Route wait filter complete");
          latestResource.waitComplete();
        }

        latestResource = null;
      }
    },

    /**
     * Marks the current navigation as complete and sends a beacon.
     * The spa soft navigation will not wait for other nodes in progress
     *
     * @memberof BOOMR.plugins.SPA
     */
    markNavigationComplete: function() {
      var i, ev, waiting,
          mh = BOOMR.plugins.AutoXHR.getMutationHandler();

      // if we're waiting due to a `routeChangeWaitFilter` then mark it complete
      if (latestResource && latestResource.wait) {
        BOOMR.plugins.SPA.wait_complete();
      }

      if (mh && mh.pending_events.length > 0) {
        for (i = mh.pending_events.length - 1; i >= 0; i--) {
          ev = mh.pending_events[i];

          if (ev && BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
            if (ev.complete) {
              // latest spa is not in progress
              break;
            }

            waiting = mh.nodesWaitingFor(i);

            debugLog("SPA Navigation being marked complete; nodes waiting for: " + waiting);

            // note that the navigation was forced complete
            BOOMR.addVar("spa.forced", "1", true);

            // add the count of nodes we were waiting for
            BOOMR.addVar("spa.waiting", mh.nodesWaitingFor(), true);

            // finalize this navigation
            mh.completeEvent(i);

            return;
          }
        }
      }

      debugLog("No SPA navigation in progress to mark as complete");
    },

    /**
     * Determines if a SPA navigation is in progress
     *
     * @memberof BOOMR.plugins.SPA
     */
    isSpaNavInProgress: function() {
      var i, ev, waiting,
          mh = BOOMR.plugins.AutoXHR.getMutationHandler();

      if (mh && mh.pending_events.length > 0) {
        for (i = mh.pending_events.length - 1; i >= 0; i--) {
          ev = mh.pending_events[i];

          if (ev && BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
            // true if the latest spa nav is not complete
            return !ev.complete;
          }
        }
      }

      return false;
    },

    /**
     * Check to see if any of the SPAs are enabled.
     * Takes a config object so that it can be called from other plugins' init without
     * worrying about plugin order
     *
     * @param {object} config
     *
     * @returns {boolean} true if one of the SPA frameworks is enabled
     */
    isSinglePageApp: function(config) {
      var singlePageApp = false,
          frameworks = this.supported_frameworks();

      for (i = 0; i < frameworks.length; i++) {
        var spa = frameworks[i];

        if (config[spa] && config[spa].enabled) {
          singlePageApp = true;
          break;
        }
      }

      return singlePageApp;
    }

  };
  BOOMR.plugins.SPA.waitComplete = BOOMR.plugins.SPA.wait_complete;
}());
