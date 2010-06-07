/**
\file rt.boomerang.plugin.js
Round trip time plugin for boomerang.
*/

// This is the RT plugin
// the two parameters are the window and document objects
(function(w, d) {

if(!BOOMR) {
	BOOMR = {};
}
if(!BOOMR.plugins) {
	BOOMR.plugins = {};
}

// private object
var rt = {
	complete: false,//! Set when this plugin has completed

	timers: {},	//! Custom timers that the developer can use
			// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
	cookie: 'BRT',	//! Name of the cookie that stores the start time and referrer
	cookie_exp:600	//! Cookie expiry in seconds
};

BOOMR.plugins.RT = {
	// Methods

	init: function(config) {
		var i, properties = ["cookie", "cookie_exp"];

		rt.complete = false;
		rt.timers = {};

		if(typeof config === "undefined" || typeof config.RT === "undefined") {
			return this;
		}

		for(i=0; i<properties.length; i++) {
			if(typeof config.RT[properties[i]] !== "undefined") {
				rt[properties[i]] = config.RT[properties[i]];
			}
		}

		return this;
	},

	// The start method is fired on page unload
	start: function() {
		var t_start = new Date().getTime();

		BOOMR.utils.setCookie(rt.cookie, { s: t_start, r: d.location }, rt.cookie_exp, "/", null);

		if(new Date().getTime() - t_start > 20) {
			// It took > 20ms to set the cookie
			// Most likely user has cookie prompting turned on so t_start won't be the actual unload time
			// We bail at this point since we can't reliably tell t_done
			BOOMR.utils.removeCookie(rt.cookie);

			// at some point we may want to log this info on the server side
		}

		return this;
	},

	startTimer: function(timer_name) {
		rt.timers[timer_name] = { start: new Date().getTime() };

		return this;
	},

	endTimer: function(timer_name, time_value) {
		if(typeof rt.timers[timer_name] === "undefined") {
			rt.timers[timer_name] = {};
		}
		rt.timers[timer_name].end = (typeof time_value === "number" ? time_value : new Date().getTime());

		return this;
	},

	setTimer: function(timer_name, time_delta) {
		rt.timers[timer_name] = { delta: time_delta };

		return this;
	},

	error: function(msg) {
		BOOMR.log(msg, "error", "boomerang.rt");
		return this;
	},

	// Called when the page has reached a "usable" state.  This may be when the onload event fires,
	// or it could be at some other moment during/after page load when the page is usable by the user
	done: function() {
		var t_start, u, r, r2, t_other=[],
		    subcookies,
		    basic_timers = { t_done: 1, t_rtpage: 1, t_resp: 1 },
		    ntimers = 0, timer;


		if(rt.complete) {
			return this;
		}

		this.endTimer("t_done");

		// A beacon may be fired automatically on page load or if the page dev fires it
		// manually with their own timers.  It may not always contain a referrer (eg: XHR calls)
		// We set default values for these cases

		u = d.location.href.replace(/#.*/, '');
		r = r2 = d.referrer.replace(/#.*/, '');

		subcookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(rt.cookie));
		BOOMR.utils.removeCookie(rt.cookie);

		if(subcookies !== null && typeof subcookies.s !== "undefined" && typeof subcookies.r !== "undefined") {
			t_start = parseInt(subcookies.s, 10);
			r = subcookies.r;
		}

		for(timer in rt.timers) {
			if(!rt.timers.hasOwnProperty(timer)) {
				continue;
			}

			if(typeof rt.timers[timer].delta !== "number") {
				rt.timers[timer].delta = rt.timers[timer].end - ( typeof rt.timers[timer].start === "number" ? rt.timers[timer].start : t_start );
			}

			if(isNaN(rt.timers[timer].delta)) {
				continue;
			}

			if(basic_timers[timer]) {
				BOOMR.addVar(timer, rt.timers[timer].delta);
			}
			else {
				t_other.push(encodeURIComponent(timer) + "|" + encodeURIComponent(rt.timers[timer].delta));
			}
			ntimers++;
		}

		// make sure an old t_other doesn't stick around
		BOOMR.removeVar('t_other');

		// At this point we decide whether the beacon should be sent or not
		if(ntimers === 0) {
			return this.error("no timers");
		}

		if(t_other.length > 0) {
			BOOMR.addVar("t_other", t_other.join(","));
		}

		rt.timers = {};

		BOOMR.addVar({ "u": u, "r": r });

		BOOMR.removeVar('r2');
		if(r2 !== r) {
			BOOMR.addVar("r2", r2);
		}

		rt.complete = true;

		BOOMR.sendBeacon();
		return this;
	},

	is_complete: function() { return rt.complete; }

};

BOOMR.subscribe("page_ready", BOOMR.plugins.RT.done, null, BOOMR.plugins.RT);
BOOMR.subscribe("page_unload", BOOMR.plugins.RT.start, null, BOOMR.plugins.RT);

}(this, this.document));
// End of RT plugin


