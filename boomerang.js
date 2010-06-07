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
if(typeof w.BOOMR !== "undefined" && typeof w.BOOMR.version !== "undefined") {
	return;
}

// Short namespace because I don't want to keep typing BOOMERANG
if(typeof w.BOOMR === "undefined" || !w.BOOMR) {
	BOOMR = {};
}

BOOMR.version = "1.0";


// bmr is a private object not reachable from outside the impl
// users can set properties by passing in to the init() method
var bmr = {
	// properties
	beacon_url: "",
	site_domain: d.location.hostname.replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').toLowerCase(),	// strip out everything except last two parts of hostname.
	user_ip: '',		//! User's ip address determined on the server

	events: {
		"script_load": [],
		"page_ready": [],
		"page_unload": [],
		"before_beacon": []
	},

	vars: {},


	// We fire events with a setTimeout so that they run asynchronously
	// and don't block each other.  This is most useful on a multi-threaded
	// JS engine.  Don't use this for onbeforeunload though
	fireEvent: function(e, i, data) {
		setTimeout(function() {
			bmr.events[e][i][0].call(bmr.events[e][i][2], data, bmr.events[e][i][1]);
		}, 10);
	}
};

// O is the boomerang object.  We merge it into BOOMR later.  Do it this way so that plugins
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
			var value = "",
			    k, nameval, c,
			    exp = "";

			if(!name) {
				return;
			}
		
			for(k in subcookies) {
				if(subcookies.hasOwnProperty(k)) {
					value += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(subcookies[k]);
				}
			}
			value = value.replace(/^&/, '');
		
			if(max_age) {
				exp = new Date();
				exp.setTime(exp.getTime() + max_age*1000);
				exp = exp.toGMTString();
			}
		
			nameval = name + '=' + value;
			c = nameval +
				((max_age) ? "; expires=" + exp : "" ) +
				((path) ? "; path=" + path : "") +
				((typeof domain !== "undefined") ? "; domain=" + (domain === null ? bmr.site_domain : domain) : "") +
				((sec) ? "; secure" : "");
		
			if ( nameval.length < 4000 ) {
				d.cookie = c;
				return ( value === this.getCookie(name) );    // confirm it was set (could be blocked by user's settings, etc.)
			}
		
			return false;
		},
		
		getSubCookies: function(cookie) {
			var cookies_a,
			    i, l, kv,
			    cookies={};

			if(!cookie) {
				return null;
			}
		
			cookies_a = cookie.split('&');
		
			if(cookies_a.length === 0) {
				return null;
			}
		
			for(i=0, l=cookies_a.length; i<l; i++) {
				kv = cookies_a[i].split('=');
				kv.push("");	// just in case there's no value
				cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
			}
		
			return cookies;
		},
		
		removeCookie: function(name) {
			return this.setCookie(name, {}, 0, "/", null);
		},
		
		addListener: function(el, sType, fn, capture) {
			if(el.addEventListener) {
				el.addEventListener(sType, fn, (capture));
			}
			else if(el.attachEvent) {
				el.attachEvent("on" + sType, fn);
			}
		}
	},

	init: function(config) {
		var i, k,
		    properties = ["beacon_url", "site_domain", "user_ip"],
		    that=this;
	
		if(!config) {
			config = {};
		}

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
			this.utils.addListener(w, "load", function() { that.fireEvent("page_ready"); that=null; });
		}
	
		return this;
	},

	// The page dev calls this method when they determine the page is usable.  Only call this if autorun is explicitly set to false
	page_ready: function() {
		this.fireEvent("page_ready");
		return this;
	},

	subscribe: function(e, fn, cb_data, cb_scope) {
		if(e === 'page_unload') {
			this.utils.addListener(w, "beforeunload", function() { fn.call(cb_scope, null, cb_data); });
		}
		else if(bmr.events.hasOwnProperty(e)) {
			bmr.events[e].push([ fn, cb_data || {}, cb_scope || null ]);
		}

		return this;
	},

	fireEvent: function(e, data) {
		var i;
		if(bmr.events.hasOwnProperty(e)) {
			for(i=0; i<bmr.events[e].length; i++) {
				bmr.fireEvent(e, i, data);
			}
		}
	},

	addVar: function(name, value) {
		if(typeof name === "string") {
			bmr.vars[name] = value;
		}
		else if(typeof name === "object") {
			var o = name, k;
			for(k in o) {
				if(o.hasOwnProperty(k)) {
					bmr.vars[k] = o[k];
				}
			}
		}
		return this;
	},

	removeVar: function(name) {
		if(bmr.hasOwnProperty(name)) {
			delete bmr[name];
		}

		return this;
	},

	sendBeacon: function() {
		var k, url, img;
	
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
		url = this.beacon_url + '?v=' + encodeURIComponent(BOOMR.version);
		for(k in bmr.vars) {
			if(bmr.vars.hasOwnProperty(k)) {
				url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(bmr.vars[k]);
			}
		}
	
		this.fireEvent("before_beacon", bmr.vars);
		img = new Image();
		img.src=url;
	},

	log: function(m,l,s) {} // create a logger - we'll try to use the YUI logger if it exists or firebug if it exists, or just fall back to nothing.
};

if(typeof w.YAHOO !== "undefined" && typeof w.YAHOO.log !== "undefined") {
	O.log = w.YAHOO.log;
}
else if(typeof w.Y !== "undefined" && typeof w.Y.log !== "undefined") {
	O.log = w.Y.log;
}
else if(typeof console !== "undefined" && typeof console.log !== "undefined") {
	O.log = function(m,l,s) { console.log(s + ": [" + l + "] ", m); };
}


for(var k in O) {
	if(O.hasOwnProperty(k)) {
		BOOMR[k] = O[k];
	}
}

if(typeof BOOMR.plugins === "undefined" || !BOOMR.plugins) {
	BOOMR.plugins = {};
}

}(this, this.document));

// end of boomerang beaconing section
// Now we start built in plugins.  I might move them into separate source files at some point

/* ---include-plugins-here--- */

BOOMR.fireEvent("script_load");



