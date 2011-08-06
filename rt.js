// This is the Round Trip Time plugin.  Abbreviated to RT
// the parameter is the window
(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

// private object
var impl = {
	complete: false,	//! Set when this plugin has completed

	timers: {},		//! Custom timers that the developer can use
				// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
	cookie: 'RT',		//! Name of the cookie that stores the start time and referrer
	cookie_exp:600,		//! Cookie expiry in seconds
	strict_referrer: true,	//! By default, don't beacon if referrers don't match.
				// If set to false, beacon both referrer values and let
				// the back end decide

	// The start method is fired on page unload.  It is called with the scope
	// of the BOOMR.plugins.RT object
	start: function() {
		var t_end, t_start = new Date().getTime();

		// We use document.URL instead of location.href because of a bug in safari 4
		// where location.href is URL decoded
		if(!BOOMR.utils.setCookie(impl.cookie,
						{ s: t_start, r: d.URL.replace(/#.*/, '') },
						impl.cookie_exp,
						//"/", null)
						"/")
		) {
			BOOMR.error("cannot set start cookie", "rt");
			return this;
		}

		t_end = new Date().getTime();
		if(t_end - t_start > 50) {
			// It took > 50ms to set the cookie
			// The user Most likely has cookie prompting turned on so
			// t_start won't be the actual unload time
			// We bail at this point since we can't reliably tell t_done
			BOOMR.utils.removeCookie(impl.cookie);

			// at some point we may want to log this info on the server side
			BOOMR.error("took more than 50ms to set cookie... aborting: "
					+ t_start + " -> " + t_end, "rt");
		}

		return this;
	}
};

BOOMR.plugins.RT = {
	// Methods

	init: function(config) {
		impl.complete = false;
		impl.timers = {};

		BOOMR.utils.pluginConfig(impl, config, "RT",
					["cookie", "cookie_exp", "strict_referrer"]);

		BOOMR.subscribe("page_ready", this.done, null, this);
		BOOMR.subscribe("page_unload", impl.start, null, this);

		return this;
	},

	getTimers: function() {
		return impl.timers;
	},

	startTimer: function(timer_name) {
		if(timer_name) {
			impl.timers[timer_name] = { start: new Date().getTime() };
			impl.complete = false;
		}

		return this;
	},

	endTimer: function(timer_name, time_value) {
		if(timer_name) {
			impl.timers[timer_name] = impl.timers[timer_name] || {};
			if(typeof impl.timers[timer_name].end === "undefined") {
				impl.timers[timer_name].end =
						(typeof time_value === "number" ? time_value : new Date().getTime());
			}
		}

		return this;
	},

	setTimer: function(timer_name, time_delta) {
		if(timer_name) {
			impl.timers[timer_name] = { delta: time_delta };
		}

		return this;
	},

	// Called when the page has reached a "usable" state.  This may be when the
	// onload event fires, or it could be at some other moment during/after page
	// load when the page is usable by the user
	done: function() {
		var t_start, u, r, r2,
			subcookies, basic_timers = { t_done: 1, t_resp: 1, t_page: 1},
			ntimers = 0, t_name, timer, t_other=[],
			ti, p;

		if(impl.complete) {
			return this;
		}

		// If the dev has already called endTimer, then this call will do nothing
		// else, it will stop the page load timer
		this.endTimer("t_done");

		// A beacon may be fired automatically on page load or if the page dev fires
		// it manually with their own timers.  It may not always contain a referrer
		// (eg: XHR calls).  We set default values for these cases

		// use document.URL instead of location.href because of a safari bug
		u = d.URL.replace(/#.*/, '');
		r = r2 = d.referrer.replace(/#.*/, '');

		subcookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(impl.cookie));
		BOOMR.utils.removeCookie(impl.cookie);

		if(subcookies !== null
			&& typeof subcookies.s !== "undefined"
			&& typeof subcookies.r !== "undefined"
		) {
			r = subcookies.r;
			if(!impl.strict_referrer || r === r2) {
				t_start = parseInt(subcookies.s, 10);
			}
		}

		if(!t_start) {
			// TODO: Change the "warn" to "info" (or drop it) once the WebTiming API
			// becomes standard (2012? 2014?)  Scream at me if you see this past 2012
			BOOMR.warn("start cookie not set, trying WebTiming API", "rt");

			// Get start time from WebTiming API see:
			// http://dev.w3.org/2006/webapi/WebTiming/
			// http://blogs.msdn.com/b/ie/archive/2010/06/28/measuring-web-page-performance.aspx
			// http://blog.chromium.org/2010/07/do-you-know-how-slow-your-web-page-is.html
			p = w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance;

			if(p && p.timing) {
				ti = p.timing;
			}
			else if(w.chrome && w.chrome.csi) {
				// Older versions of chrome also have a timing API that's sort of documented here:
				// http://ecmanaut.blogspot.com/2010/06/google-bom-feature-ms-since-pageload.html
				// source here:
				// http://src.chromium.org/viewvc/chrome/trunk/src/chrome/renderer/loadtimes_extension_bindings.cc?view=markup
				ti = {
					requestStart: w.chrome.csi().startE
				};
			}

			if(ti) {
				// First check if requestStart is set.  It will be 0 if
				// the page were fetched from cache.  If so, check fetchStart
				// which should always be there except if not implemented. If
				// not, then look at navigationStart.  If none are set, we
				// leave t_start alone so that timers that depend on it don't
				// get sent back.
				t_start = ti.requestStart
						|| ti.fetchStart
						|| ti.navigationStart
						|| undefined;
			}
			else {
				BOOMR.warn("This browser doesn't support the WebTiming API", "rt");
			}
		}

		// make sure old variables don't stick around
		BOOMR.removeVar('t_done', 't_page', 't_resp', 'u', 'r', 'r2');

		for(t_name in impl.timers) {
			if(!impl.timers.hasOwnProperty(t_name)) {
				continue;
			}

			timer = impl.timers[t_name];

			// if delta is a number, then it was set using setTimer
			// if not, then we have to calculate it using start & end
			if(typeof timer.delta !== "number") {
				if(typeof timer.start !== "number") {
					timer.start = t_start;
				}
				timer.delta = timer.end - timer.start;
			}

			// If the caller did not set a start time, and if there was no start cookie
			// then timer.delta will be NaN, in which case we discard it.
			if(isNaN(timer.delta)) {
				continue;
			}

			if(basic_timers.hasOwnProperty(t_name)) {
				BOOMR.addVar(t_name, timer.delta);
			}
			else {
				t_other.push(t_name + '|' + timer.delta);
			}
			ntimers++;
		}

		// At this point we decide whether the beacon should be sent or not
		if(ntimers) {
			BOOMR.addVar({ "u": u, "r": r });

			if(r2 !== r) {
				BOOMR.addVar("r2", r2);
			}

			if(t_other.length) {
				BOOMR.addVar("t_other", t_other.join(','));
			}
		}

		//impl.timers = {};
		impl.complete = true;

		BOOMR.sendBeacon();	// we call sendBeacon() anyway because some other plugin
					// may have blocked waiting for RT to complete
		return this;
	},

	is_complete: function() { return impl.complete; }

};

}(window));
// End of RT plugin