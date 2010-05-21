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


// create a logger - we'll try to use the YUI logger if it exists or firebug if it exists, or just fall back to nothing.
var log = function(m,l,s) {};

if(typeof YAHOO.log !== "undefined") {
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
		return setCookie(name, {}, 0, "/", site_domain);
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

BMR.sendBeacon = function() {
	var i, k, url = this.beacon_url + '?v=' + encodeURIComponent(bmr_version);
	var that=this;

	for(k in this.plugins) {
		if(this.plugins.hasOwnProperty(k)) {
			var plugin_complete = this.plugins[k].is_complete();
			if(plugin_complete === false) {
				setTimeout(function() { that.sendBeacon(); that=null; }, 100);
				return;
			}
			else if(plugin_complete === "abort") {
				return;
			}
		}
	}

	for(k in this.vars) {
		if(this.vars.hasOwnProperty(k)) {
			url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(this.vars[k]);
		}
	}

	var img = new Image();
	img.src=url;
};






}(this, this.document));	// end of beaconing section
