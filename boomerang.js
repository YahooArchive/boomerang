/**
\file boomerang.js
boomerang measures various performance characteristics of your user's browsing
experience and beacons it back to your server.

\details
To use this you'll need a web site, lots of users and the ability to do
something with the data you collect.  How you collect the data is up to
you, but we have a few ideas.

Copyright (c) 2010 Yahoo! Inc. All rights reserved.
Code licensed under the BSD License.  See the file LICENSE.txt
for the full license text.
*/

// beaconing section
// the two parameters are the window and document objects
(function(w, d) {

// don't allow this code to be included twice
if(typeof BMR !== "undefined" && typeof BMR.version !== "undefined") {
	return;
}

// Short namespace because I don't want to keep typing BOOMERANG
if(typeof w.BMR === "undefined" || !w.BMR) {
	BMR = {};
}

BMR.version = "1.0";


// bmr is a private object not reachable from outside the impl
// users can set properties by passing in to the init() method
var bmr = {
	// properties
	beacon_url: "",
	site_domain: d.location.hostname.replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').toLowerCase(),	// strip out everything except last two parts of hostname.
	user_ip: '',		//! User's ip address determined on the server

	events: {
		"script_load": [],
		"page_load": [],
		"page_unload": [],
		"before_beacon": []
	},

	vars: {}

};


// O is the boomerang object.  We merge it into BMR later.  Do it this way so that plugins
// may be defined before including the script.

var O = {
	// Utility functions
	utils: {
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
				((typeof domain !== "undefined") ? "; domain=" + (domain === null ? bmr.site_domain : domain) : "") +
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
			return setCookie(name, {}, 0, "/", null);
		},
		
		addListener: function(el, sType, fn, capture) {
			if(w.addEventListener) {
				el.addEventListener(sType, fn, (capture));
			}
			else if(w.attachEvent) {
				el.attachEvent("on" + sType, fn);
			}
		}
	},

	init: function(config) {
		var i, k, properties = ["beacon_url", "site_domain", "user_ip"];
	
		for(i=0; i<properties.length; i++) {
			if(typeof config[properties[i]] !== "undefined") {
				bmr[properties[i]] = config[properties[i]];
			}
		}

		if(typeof config.log  !== "undefined") {
			this.log = config.log;
		}
	
		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k) && typeof this.plugins[k].init === "function") {
				this.plugins[k].init(config);
			}
		}
	
		// The developer can override onload by setting autorun to false
		if(typeof config.autorun === "undefined" || config.autorun !== false) {
			this.utils.addListener(w, "load", function() { this.fireEvent("page_load"); });
		}
		this.utils.addListener(w, "beforeunload", function() { this.fireEvent("page_unload"); });
	
		return this;
	},

	// The page dev calls this method when they determine the page is usable.  Only call this if autorun is explicitly set to false
	page_loaded: function() {
		this.fireEvent("page_load");
		return this;
	},

	subscribe: function(e, fn, cb_data, cb_scope) {
		if(bmr.events.hasOwnProperty(e)) {
			bmr.events[e].push([ fn, cb_data || {}, cb_scope || null ])
		}

		return this;
	},

	fireEvent: function(e) {
		var i;
		if(bmr.events.hasOwnProperty(e)) {
			for(i=0; i<bmr.events[e].length; i++) {
				_fireEvent(e, i);
			}
		}
	},

	addVar: function(name, value) {
		bmr.vars[name] = value;
		return this;
	},

	removeVar: function(name) {
		if(bmr.hasOwnProperty(name)) {
			delete bmr.name
		}

		return this;
	},

	sendBeacon = function() {
		var i, k, url, img;
	
		// At this point someone is ready to send the beacon.  We send
		// the beacon only if all plugins have finished doing what they
		// wanted to do
		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k)) {
				if(!this.plugins[k].is_complete()) {
					return;
				}
			}
		}
	
		// If we reach here, all plugins have completed
		url = this.beacon_url + '?v=' + encodeURIComponent(BMR.version);
		for(k in bmr.vars) {
			if(bmr.vars.hasOwnProperty(k)) {
				url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(bmr.vars[k]);
			}
		}
	
		this.fireEvent("before_beacon");
		img = new Image();
		img.src=url;
	},

	log: function(m,l,s) {} // create a logger - we'll try to use the YUI logger if it exists or firebug if it exists, or just fall back to nothing.
};

if(typeof YAHOO !== "undefined" && typeof YAHOO.log !== "undefined") {
	O.log = YAHOO.log;
}
else if(typeof Y !== "undefined" && typeof Y.log !== "undefined") {
	O.log = Y.log;
}
else if(typeof console !== "undefined" && typeof console.log !== "undefined") {
	O.log = function(m,l,s) { console.log(s + ": [" + l + "] " + m); };
}


// We fire events with a setTimeout so that they run asynchronously
// and don't block each other.  This is most useful on a multi-threaded
// JS engine
var _fireEvent = function(e, i) {
	setTimeout(function() { bmr.events[e][i][0].call(bmr.events[e][i][1], bmr.events[e][i][2]); }, 10);
};

for(var k in O) {
	if(O.hasOwnProperty(k)) {
		BMR[k] = O[k];
	}
}

if(typeof BMR.plugins === "undefined" || !BMR.plugins) {
	BMR.plugins = {};
}

}(this, this.document));

// end of boomerang beaconing section
// Now we start built in plugins.  I might move them into separate source files at some point


// This is the RT plugin
// the two parameters are the window and document objects
(function(w, d) {

// private object
var rt = {
	complete: false,//! Set when this plugin has completed

	timers: {},	//! Custom timers that the developer can use
			// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
	cookie: 'BRT',	//! Name of the cookie that stores the start time and referrer
	cookie_exp:600,	//! Cookie expiry in seconds

};

BMR.plugins.RT = {
	// Methods

	init: function(config) {
		var i, properties = ["cookie", "cookie_exp"];

		rt.complete = false;

		if(typeof config === "undefined" || typeof config.RT === "undefined") {
			return;
		}

		for(i=0; i<config.RT.length; i++) {
			if(typeof config.RT[properties[i]] !== "undefined") {
				rt[properties[i]] = config.RT[properties[i]];
			}
		}
	},

	// The start method is fired on page unload
	start: function() {
		var t_start = new Date().getTime();

		BMR.utils.setCookie(rt.cookie, { s: t_start, r: d.location }, rt.cookie_exp, "/", null);

		if(new Date().getTime() - t_start > 20) {
			// It took > 20ms to set the cookie
			// Most likely user has cookie prompting turned on so t_start won't be the actual unload time
			// We bail at this point since we can't reliably tell t_done
			removeCookie(rt.cookie);

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
		BMR.log(msg, "error", "boomerang");
		return this;
	},

	// Called when the page has reached a "loaded" state.  This may be when the onload event fires,
	// or it could be at some other moment during/after page load when the page is usable by the user
	done: function() {
		var t_start, u, r, r2, t_other=[];

		if(rt.complete) {
			return this;
		}

		this.endTimer("t_done");

		// A beacon may be fired automatically on page load or if the page dev fires it
		// manually with their own timers.  It may not always contain a referrer (eg: XHR calls)
		// We set default values for these cases

		u = d.location.href.replace(/#.*/, '');
		r = r2 = d.referrer.replace(/#.*/, '');

		var subcookies = BMR.utils.getSubCookies(BMR.utils.getCookie(rt.cookie));
		BMR.utils.removeCookie(rt.cookie);

		if(subcookies !== null && typeof subcookies.s !== "undefined" && typeof subcookies.r !== "undefined") {
			t_start = parseInt(subcookies.s, 10);
			r = subcookies.r;
		}

		var basic_timers = { t_done: 1, t_rtpage: 1, t_resp: 1 };

		var ntimers = 0;
		for(var timer in rt.timers) {
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
				BMR.addVar(timer, rt.timers[timer].delta);
			}
			else {
				t_other.push(encodeURIComponent(timer) + "|" + encodeURIComponent(rt.timers[timer].delta));
			}
			ntimers++;
		}

		// make sure an old t_other doesn't stick around
		BMR.removeVar('t_other');

		// At this point we decide whether the beacon should be sent or not
		if(ntimers === 0) {
			return this.error("no timers");
		}

		if(t_other.length > 0) {
			BMR.addVar("t_other", t_other.join(","));
		}

		rt.timers = {};

		BMR.addVar("u", u);
		BMR.addVar("r", r);

		BMR.removeVars('r2');
		if(r2 !== r) {
			BMR.addVar("r2", r2);
		}

		rt.complete = true;

		BMR.sendBeacon();
		return this;
	},

	is_complete: function() { return rt.complete; },

};

BMR.subscribe("page_load", BMR.RT.done, null, BMR.RT);
BMR.subscribe("page_unload", BMR.RT.start, null, BMR.RT);

}(this, this.document));
// End of RT plugin


BMR.fireEvent("script_load");


/*
The boomerang story... or how this works.

We have a BMR namespace/object, which contains a bunch of things...
- utility functions to deal with cookies and events
- variables to be beaconed
- developer defined parameters for the current page/site

The BMR object exports its own evets for page_load, page_unload, script_load and before_beacon.
Plugins may subscribe to these events using the BMR.subscribe method.
*/
