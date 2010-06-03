/**
\file boomerang.js
boomerang measures various performance characteristics of your user's browsing
experience and beacons it back to your server.

\details
To use this you'll need a web site, lots of users and the ability to do
something with the data you collect.  How you collect the data is up to
you, but we have a few ideas.

\copyright
Copyright (c) 2010 Yahoo! Inc. All rights reserved.

\license
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by
applicable law or agreed to in writing, software distributed under the License
is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. See accompanying
LICENSE file. 
*/

// Short namespace because I don't want to keep typing BOOMERANG

if(typeof this.BMR === "undefined" || !this.BMR) {
	var BMR = {};
}

// beaconing section
// the two parameters are the window and document objects
(function(w, d) {

var bmr_version = "1.0";

BMR.beacon_url = BMR.beacon_url || "";
BMR.site_domain = BMR.site_domain || d.location.hostname.replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').toLowerCase();	// strip out everything except last two parts of hostname.
														// doesn't work with intl domains, but send a patch if you can fix it
BMR.user_ip = '';		//! User's ip address determined on the server


// create a logger - we'll try to use the YUI logger if it exists or firebug if it exists, or just fall back to nothing.
var log = function(m,l,s) {};

if(typeof YAHOO !== "undefined" && typeof YAHOO.log !== "undefined") {
	log = YAHOO.log;
}
else if(typeof Y !== "undefined" && typeof Y.log !== "undefined") {
	log = Y.log;
}
else if(typeof console !== "undefined" && typeof console.log !== "undefined") {
	log = function(m,l,s) { console.log(s + ": [" + l + "] " + m); };
}

BMR.log = log;

BMR.vars = {};
BMR.plugins = {};

var _bmr_events = {
	"script_load": [],
	"page_load": [],
	"page_unload": [],
	"before_beacon": []
};


/*
	Utility functions
*/

BMR.utils = {
	getCookie: function(name) {
		name = ' ' + name + '=';
	
		var i, cookies;
		cookies = ' ' + d.cookie + ';';
		if ( (i=cookies.indexOf(name)) >= 0 ) {
			i += name.length;
			cookies = cookies.substring(i, cookies.indexOf(';', i));
			return cookies;
		}
	
		return "";
	},
	
	setCookie: function(name, subcookies, max_age, path, domain, sec) {
		if(!name) {
			return;
		}
	
		var value = "";
		for(var k in subcookies) {
			if(subcookies.hasOwnProperty(k)) {
				value += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(subcookies[k]);
			}
		}
		value = value.replace(/^&/, '');
	
		var exp = "";
		if(max_age) {
			exp = new Date();
			exp.setTime(exp.getTime() + max_age*1000);
			exp = exp.toGMTString();
		}
	
		var nameval = name + '=' + value;
		var c = nameval +
			((max_age) ? "; expires=" + exp : "" ) +
			((path) ? "; path=" + path : "") +
			((domain) ? "; domain=" + domain : "") +
			((sec) ? "; secure" : "");
	
		if ( nameval.length < 4000 ) {
			d.cookie = c;
			return ( value === getCookie(name) );    // confirm it was set (could be blocked by user's settings, etc.)
		}
	
		return false;
	},
	
	getSubCookies: function(cookie) {
		if(!cookie) {
			return null;
		}
	
		var cookies_a = cookie.split('&');
	
		if(cookies_a.length === 0) {
			return null;
		}
	
		var cookies = {};
		for(var i=0, l=cookies_a.length; i<l; i++) {
			var kv = cookies_a[i].split('=');
			kv.push("");	// just in case there's no value
			cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
		}
	
		return cookies;
	},
	
	removeCookie: function(name) {
		return setCookie(name, {}, 0, "/", BMR.site_domain);
	},
	
	addListener: function(el, sType, fn, capture) {
		if(w.addEventListener) {
			el.addEventListener(sType, fn, (capture));
		}
		else if(w.attachEvent) {
			el.attachEvent("on" + sType, fn);
		}
	}
};

var _fireEvent = function(e) {
	var i;
	if(_bmr_events.hasOwnProperty(e)) {
		for(i=0; i<_bmr_events[e].length; i++) {
			_bmr_events[e][i][0].call(_bmr_events[e][i][1], _bmr_events[e][i][2]);
		}
	}
};

BMR.init = function(config) {
	var i, k, properties = ["beacon_url", "site_domain", "user_ip"];

	for(i=0; i<properties.length; i++) {
		if(typeof config[properties[i]] !== "undefined") {
			BMR[properties[i]] = config[properties[i]];
		}
	}

	for(k in this.plugins) {
		if(this.plugins.hasOwnProperty(k) && typeof this.plugins[k].init === "function") {
			this.plugins[k].init(config);
		}
	}

	// The developer can override onload by setting autorun to false
	if(typeof config.autorun === "undefined" || config.autorun !== false) {
		this.utils.addListener(w, "load", function() { _fireEvent("page_load"); });
	}
	this.utils.addListener(w, "beforeunload", function() { _fireEvent("page_unload"); });

	return this;
};

// The page dev calls this method when they determine the page is usable.  Only call this if autorun is explicitly set to false
BMR.page_loaded = function() { _fireEvent("page_load"); };

BMR.subscribe = function(e, fn, cb_data, cb_scope) {
	if(_bmr_events.hasOwnProperty(e)) {
		_bmr_events[e].push([ fn, cb_data || {}, cb_scope || null ])
	};

	return this;
};

// This function might be called multiple times as multiple plugins complete,
// but the beacon should only be sent once for each set values
var _bcn_defer_timeout=null;
BMR.sendBeacon = function() {
	var i, k, url, img;

	// This means we already have a deferred sendBeacon call, so don't allow any others to run
	// This will only work correctly in a single-threaded JS engine.  In a multi-threaded engine,
	// there is a chance that the timeout and another call of sendBeacon might fire concurrently
	// and we'll end up with two beacons.  I'll get a better solution later.
	if(_bcn_defer_timeout) {
		return;
	}

	var that=this;

	// At this point the base is ready to send the beacon.
	// We now have to wait for all plugins to finish what they're supposed to do
	for(k in this.plugins) {
		if(this.plugins.hasOwnProperty(k)) {
			var plugin_complete = this.plugins[k].is_complete();
			if(plugin_complete === false) {
				_bcn_defer_timeout = setTimeout(function() { _bcn_defer_timeout = null; that.sendBeacon(); that=null; }, 100);
				return;
			}
			else if(plugin_complete === "abort") {
				return;
			}
		}
	}

	// If we reach here, all plugins have completed
	url = this.beacon_url + '?v=' + encodeURIComponent(bmr_version);
	for(k in this.vars) {
		if(this.vars.hasOwnProperty(k)) {
			url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(this.vars[k]);
		}
	}

	_fireEvent("before_beacon");
	img = new Image();
	img.src=url;
};




BMR.plugins.RT = {
	// Properties

	timers: {},	//! Custom timers that the developer can use
			// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
	cookie: 'BRT',	//! Name of the cookie that stores the start time and referrer
	cookie_exp:600,	//! Cookie expiry in seconds

	_complete: false,	// set when this plugin has completed
	
	// Methods

	// The start method is fired on page unload
	start: function() {
		var t_start = new Date().getTime();

		BMR.utils.setCookie(this.cookie, { s: t_start, r: d.location }, this.cookie_exp, "/", BMR.site_domain);

		if(new Date().getTime() - t_start > 20) {
			// It took > 20ms to set the cookie
			// Most likely user has cookie prompting turned on so t_start won't be the actual unload time
			// We bail at this point since we can't reliably tell t_done
			removeCookie(this.cookie);

			// at some point we may want to log this info on the server side
		}

		return this;
	},

	addVar: function(name, value) {
		BMR.vars[name] = value;
		return this;
	},

	startTimer: function(timer_name) {
		this.timers[timer_name] = { start: new Date().getTime() };

		return this;
	},

	endTimer: function(timer_name, time_value) {
		if(typeof this.timers[timer_name] === "undefined") {
			this.timers[timer_name] = {};
		}
		this.timers[timer_name].end = (typeof time_value === "number" ? time_value : new Date().getTime());

		return this;
	},

	setTimer: function(timer_name, time_delta) {
		this.timers[timer_name] = { delta: time_delta };

		return this;
	},

	error: function(msg) {
		BMR.log(msg, "error", "boomerang");
		return this;
	},

	// Called when the page has reached a "loaded" state.  This may be when the onload event fires,
	// or it could be at some other moment during/after page load when the page is usable by the user
	done: function() {
		var t_start, u, r, r2, t_other=[];

		if(this._complete) {
			return this;
		}

		this.endTimer("t_done");

		// initiate the bandwidth test at this point so that it will complete at some point near when we need it
		if(typeof BMR.plugins.BW !== "undefined") {
			BMR.plugins.BW.run();
		}

		// A beacon may be fired automatically on page load or if the page dev fires it
		// manually with their own timers.  It may not always contain a referrer (eg: XHR calls)
		// We set default values for these cases

		u = d.location.href.replace(/#.*/, '');
		r = r2 = d.referrer.replace(/#.*/, '');

		var subcookies = BMR.utils.getSubCookies(getCookie(this.cookie));
		BMR.utils.removeCookie(this.cookie);

		if(subcookies !== null && typeof subcookies.s !== "undefined" && typeof subcookies.r !== "undefined") {
			t_start = parseInt(subcookies.s, 10);
			r = subcookies.r;
		}

		var basic_timers = { t_done: 1, t_rtpage: 1, t_resp: 1 };

		var ntimers = 0;
		for(var timer in this.timers) {
			if(!this.timers.hasOwnProperty(timer)) {
				continue;
			}

			if(typeof this.timers[timer].delta !== "number") {
				this.timers[timer].delta = this.timers[timer].end - ( typeof this.timers[timer].start === "number" ? this.timers[timer].start : t_start );
			}

			if(isNaN(this.timers[timer].delta)) {
				continue;
			}

			if(basic_timers[timer]) {
				this.addVar(timer, this.timers[timer].delta);
			}
			else {
				t_other.push(encodeURIComponent(timer) + "|" + encodeURIComponent(this.timers[timer].delta));
			}
			ntimers++;
		}

		// make sure an old t_other doesn't stick around
		delete BMR.vars.t_other;

		// At this point we decide whether the beacon should be sent or not
		if(ntimers === 0) {
			return this.error("no timers");
		}

		if(t_other.length > 0) {
			this.addVar("t_other", t_other.join(","));
		}

		this.timers = {};

		this.addVar("u", u);
		this.addVar("r", r);

		delete BMR.vars.r2;
		if(r2 !== r) {
			this.addVar("r2", r2);
		}

		this._complete = true;

		BMR.sendBeacon();
		return this;
	},

	is_complete: function() { return this._complete; },

	init: function(config) {
		BMR.subscribe("page_load", BMR.RT.done, null, BMR.RT);
		BMR.subscribe("page_unload", BMR.RT.start, BMR.RT);
	}
};


_fireEvent("script_load");
}(this, this.document));	// end of beaconing section


/*
The boomerang story... or how this works.

We have a BMR namespace/object, which contains a bunch of things...
- utility functions to deal with cookies and events
- variables to be beaconed
- developer defined parameters for the current page/site

The BMR object exports its own evets for page_load, page_unload, script_load and before_beacon.
Plugins may subscribe to these events using the BMR.subscribe method.
*/
