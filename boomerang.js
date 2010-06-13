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


// impl is a private object not reachable from outside the BOOMR object
// users can set properties by passing in to the init() method
var impl = {
	// properties
	beacon_url: "",
	site_domain: w.location.hostname.replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').toLowerCase(),	// strip out everything except last two parts of hostname.
	user_ip: '',		//! User's ip address determined on the server

	events: {
		"script_load": [],
		"page_ready": [],
		"page_unload": [],
		"before_beacon": []
	},

	vars: {},

	disabled_plugins: {},

	// We fire events with a setTimeout so that they run asynchronously
	// and don't block each other.  This is most useful on a multi-threaded
	// JS engine.  Don't use this for onbeforeunload though
	asyncEvent: function(e, i, data) {
		setTimeout(function() {
			impl.events[e][i][0].call(impl.events[e][i][2], data, impl.events[e][i][1]);
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
				((typeof domain !== "undefined") ? "; domain=" + (domain === null ? impl.site_domain : domain) : "") +
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
		},

		pluginConfig: function(o, config, plugin_name, properties) {
			var i, props=0;

			if(typeof config === "undefined" || typeof config[plugin_name] === "undefined") {
				return false;
			}

			for(i=0; i<properties.length; i++) {
				if(typeof(config[plugin_name][properties[i]]) !== "undefined") {
					o[properties[i]] = config[plugin_name][properties[i]];
					props++;
				}
			}

			return (props>0);
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
				impl[properties[i]] = config[properties[i]];
			}
		}

		if(typeof config.log  !== "undefined") {
			this.log = config.log;
		}
	
		for(k in this.plugins) {
			if(config[k] && typeof config[k].enabled !== "undefined" && config[k].enabled === false) {	// config[pugin].enabled has been set to false
				impl.disabled_plugins[k] = 1;
				continue;
			}
			else if(impl.disabled_plugins[k]) {
				delete impl.disabled_plugins[k];
			}

			if(this.plugins.hasOwnProperty(k) && typeof this.plugins[k].init === "function") {		// plugin exists and has an init method
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

	subscribe: function(e, fn, cb_data, cb_scope, async) {
		var i, h;
		if(e === 'page_unload') {
			this.utils.addListener(w, "unload", function() { fn.call(cb_scope, null, cb_data); });
		}

		if(impl.events.hasOwnProperty(e)) {
			for(i=0; i<impl.events[e].length; i++) {
				h = impl.events[e][i];
				// don't allow a handler to be attached more than once to the same event
				if(h[0] === fn && h[1] === cb_data && h[2] === cb_scope) {
					return this;
				}
			}
			impl.events[e].push([ fn, cb_data || {}, cb_scope || null, async || false ]);
		}

		return this;
	},

	fireEvent: function(e, data) {
		var i, sync_events=[], h;
		if(impl.events.hasOwnProperty(e)) {
			for(i=0; i<impl.events[e].length; i++) {
				// First we fire all asynchronous event handlers
				if(impl.events[e][i][3]) {
					impl.asyncEvent(e, i, data);
				}
				else {
					sync_events.push(i);
				}
			}
		}

		// Then fire all synchronous handlers in order of subscription
		for(i=0; i<sync_events.length; i++) {
			var h = impl.events[e][sync_events[i]];
			h[0].call(h[2], data, h[1]);
		}
	},

	addVar: function(name, value) {
		if(typeof name === "string") {
			impl.vars[name] = value;
		}
		else if(typeof name === "object") {
			var o = name, k;
			for(k in o) {
				if(o.hasOwnProperty(k)) {
					impl.vars[k] = o[k];
				}
			}
		}
		return this;
	},

	removeVar: function() {
		var i;
		if(!arguments.length) {
			return this;

		for(i=0; i<arguments.length; i++) {
			if(impl.vars.hasOwnProperty(arguments[i])) {
				delete impl.vars[arguments[i]];
			}
		}

		return this;
	},

	sendBeacon: function() {
		var k, url, img, nparams=0;
	
		// At this point someone is ready to send the beacon.  We send
		// the beacon only if all plugins have finished doing what they
		// wanted to do
		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k)) {
				if(impl.disabled_plugins[k]) {
					continue;
				}
				if(!this.plugins[k].is_complete()) {
					return this;
				}
			}
		}
	
		// If we reach here, all plugins have completed
		this.fireEvent("before_beacon", impl.vars);

		// Don't send a beacon if no beacon_url has been set
		if(!this.beacon_url) {
			return this;
		}

		url = this.beacon_url + '?v=' + encodeURIComponent(BOOMR.version);
		for(k in impl.vars) {
			if(impl.vars.hasOwnProperty(k)) {
				nparams++;
				url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(impl.vars[k]);
			}
		}
	
		// only send beacon if we actually have something to beacon back
		if(nparams) {
			img = new Image();
			img.src=url;
		}

		return this;
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


// This is the Round Trip Time plugin.  Abbreviated to RT
// the two parameters are the window and document objects
(function(w, d) {

if(!BOOMR) {
	BOOMR = {};
}
if(!BOOMR.plugins) {
	BOOMR.plugins = {};
}

// private object
var impl = {
	complete: false,	//! Set when this plugin has completed

	timers: {},		//! Custom timers that the developer can use
				// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
	cookie: 'BRT',		//! Name of the cookie that stores the start time and referrer
	cookie_exp:600,		//! Cookie expiry in seconds
	strict_referrer: true	//! By default, don't beacon if referrers don't match. If set to false, beacon both referrer values and let the back end decide
};

BOOMR.plugins.RT = {
	// Methods

	init: function(config) {
		impl.complete = false;
		impl.timers = {};

		BOOMR.utils.pluginConfig(impl, config, "RT", ["cookie", "cookie_exp", "strict_referrer"]);

		BOOMR.subscribe("page_ready", BOOMR.plugins.RT.done, null, BOOMR.plugins.RT, true);
		BOOMR.subscribe("page_unload", BOOMR.plugins.RT.start, null, BOOMR.plugins.RT);

		return this;
	},

	// The start method is fired on page unload
	start: function() {
		var t_end, t_start = new Date().getTime();

		if(!BOOMR.utils.setCookie(impl.cookie, { s: t_start, r: d.URL.replace(/#.*/, '') }, impl.cookie_exp, "/", null)) {
			return this.error("cannot set start cookie");
		}

		t_end = new Date().getTime();
		if(t_end - t_start > 50) {
			// It took > 50ms to set the cookie
			// Most likely user has cookie prompting turned on so t_start won't be the actual unload time
			// We bail at this point since we can't reliably tell t_done
			BOOMR.utils.removeCookie(impl.cookie);

			// at some point we may want to log this info on the server side
			this.error("took more than 50ms to set cookie... aborting: " + t_start + " -> " + t_end);
		}

		return this;
	},

	startTimer: function(timer_name) {
		impl.timers[timer_name] = { start: new Date().getTime() };
		impl.complete = false;

		return this;
	},

	endTimer: function(timer_name, time_value) {
		if(typeof impl.timers[timer_name] === "undefined") {
			impl.timers[timer_name] = {};
		}
		impl.timers[timer_name].end = (typeof time_value === "number" ? time_value : new Date().getTime());

		return this;
	},

	setTimer: function(timer_name, time_delta) {
		impl.timers[timer_name] = { delta: time_delta };

		return this;
	},

	error: function(msg) {
		BOOMR.log(msg, "error", "boomerang.rt");
		return this;
	},

	warn: function(msg) {
		BOOMR.log(msg, "warn", "boomerang.rt");
		return this;
	},

	// Called when the page has reached a "usable" state.  This may be when the onload event fires,
	// or it could be at some other moment during/after page load when the page is usable by the user
	done: function() {
		var t_start, u, r, r2, t_other=[],
		    subcookies,
		    basic_timers = { t_done: 1, t_page: 1, t_resp: 1 },
		    ntimers = 0, timer;

		if(impl.complete) {
			return this;
		}

		this.endTimer("t_done");

		// A beacon may be fired automatically on page load or if the page dev fires it
		// manually with their own timers.  It may not always contain a referrer (eg: XHR calls)
		// We set default values for these cases

		u = d.URL.replace(/#.*/, '');
		r = r2 = d.referrer.replace(/#.*/, '');

		subcookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(impl.cookie));
		BOOMR.utils.removeCookie(impl.cookie);

		if(subcookies !== null && typeof subcookies.s !== "undefined" && typeof subcookies.r !== "undefined") {
			r = subcookies.r;
			if(!impl.strict_referrer || r === r2) { 
				t_start = parseInt(subcookies.s, 10);
			}
		}
		else {
			this.warn("start cookie not set");
		}

		// make sure old variables don't stick around
		BOOMR.removeVar('t_other', 't_done', 't_page', 't_resp', 'u', 'r', 'r2');

		for(timer in impl.timers) {
			if(!impl.timers.hasOwnProperty(timer)) {
				continue;
			}

			if(typeof impl.timers[timer].delta !== "number") {
				impl.timers[timer].delta = impl.timers[timer].end - ( typeof impl.timers[timer].start === "number" ? impl.timers[timer].start : t_start );
			}

			if(isNaN(impl.timers[timer].delta)) {
				continue;
			}

			if(basic_timers[timer]) {
				BOOMR.addVar(timer, impl.timers[timer].delta);
			}
			else {
				t_other.push(encodeURIComponent(timer) + "|" + encodeURIComponent(impl.timers[timer].delta));
			}
			ntimers++;
		}

		// At this point we decide whether the beacon should be sent or not
		if(ntimers === 0) {
			impl.complete = true;			// no point blocking other plugins
			return this.error("no timers");
		}

		if(t_other.length > 0) {
			BOOMR.addVar("t_other", t_other.join(","));
		}

		impl.timers = {};

		BOOMR.addVar({ "u": u, "r": r });

		if(r2 !== r) {
			BOOMR.addVar("r2", r2);
		}

		impl.complete = true;

		BOOMR.sendBeacon();
		return this;
	},

	is_complete: function() { return impl.complete; }

};

}(this, this.document));
// End of RT plugin

// This is the Bandwidth & Latency plugin abbreviated to BW
// the two parameters are the window and document objects
(function(w, d) {

if(!BOOMR) {
	BOOMR = {};
}
if(!BOOMR.plugins) {
	BOOMR.plugins = {};
}

// We choose image sizes so that we can narrow down on a bandwidth range as soon as possible
// the sizes chosen correspond to bandwidth values of 14-64kbps, 64-256kbps, 256-1024kbps, 1-2Mbps, 2-8Mbps, 8-30Mbps & 30Mbps+
// Anything below 14kbps will probably timeout before the test completes
// Anything over 60Mbps will probably be unreliable since latency will make up the largest part of download time
// If you want to extend this further to cover 100Mbps & 1Gbps networks, use image sizes of 19,200,000 & 153,600,000 bytes respectively
// See https://spreadsheets.google.com/ccc?key=0AplxPyCzmQi6dDRBN2JEd190N1hhV1N5cHQtUVdBMUE&hl=en_GB for a spreadsheet with the details
var images=[
	{ name: "image-0.png", size: 11483, timeout: 1400 }, 
	{ name: "image-1.png", size: 40658, timeout: 1200 }, 
	{ name: "image-2.png", size: 164897, timeout: 1300 }, 
	{ name: "image-3.png", size: 381756, timeout: 1500 }, 
	{ name: "image-4.png", size: 1234664, timeout: 1200 }, 
	{ name: "image-5.png", size: 4509613, timeout: 1200 }, 
	{ name: "image-6.png", size: 9084559, timeout: 1200 }
];

images.end = images.length;
images.start = 0;

// abuse arrays to do the latency test simply because it avoids a bunch of branches in the rest of the code
images.l = { name: "image-l.gif", size: 35, timeout: 1000 };

// private object
var impl = {
	// properties
	base_url: 'images/',
	timeout: 15000,
	nruns: 5,
	latency_runs: 10,
	user_ip: '',
	cookie_exp: 7*86400,
	cookie: 'BA',

	// state
	results: [],
	latencies: [],
	latency: null,
	runs_left: 0,
	aborted: false,
	complete: false,
	running: false,

	// methods

	debug: function(msg)
	{
		BOOMR.log(msg, "debug", "boomerang.bw");
	},
	
	ncmp: function(a, b) { return (a-b); },
	
	iqr: function(a)
	{
		var l = a.length-1, q1, q3, fw, b = [], i;

		q1 = (a[Math.floor(l*0.25)] + a[Math.ceil(l*0.25)])/2;
		q3 = (a[Math.floor(l*0.75)] + a[Math.ceil(l*0.75)])/2;
	
		fw = (q3-q1)*1.5;
	
		l++;
	
		for(i=0; i<l && a[i] < q3+fw; i++) {
			if(a[i] > q1-fw) {
				b.push(a[i]);
			}
		}
	
		return b;
	},
	
	calc_latency: function()
	{
		var	i, n,
			sum=0, sumsq=0,
			amean, median,
			std_dev, std_err,
			lat_filtered;
	
		// We first do IQR filtering and use the resulting data set for all calculations
		lat_filtered = this.iqr(this.latencies.sort(this.ncmp));
		n = lat_filtered.length;
	
		this.debug(lat_filtered);
	
		// First we get the arithmetic mean, standard deviation and standard error
		// We ignore the first since it paid the price of DNS lookup, TCP connect and slow start
		for(i=1; i<n; i++) {
			sum += lat_filtered[i];
			sumsq += lat_filtered[i] * lat_filtered[i];
		}
	
		n--;	// Since we started the loop with 1 and not 0
	
		amean = Math.round(sum / n);
	
		std_dev = Math.sqrt( sumsq/n - sum*sum/(n*n));
	
		// See http://en.wikipedia.org/wiki/1.96 and http://en.wikipedia.org/wiki/Standard_error_%28statistics%29
		std_err = (1.96 * std_dev/Math.sqrt(n)).toFixed(2);
	
		std_dev = std_dev.toFixed(2);
	
	
		n = lat_filtered.length-1;
	
		median = Math.round((lat_filtered[Math.floor(n/2)] + lat_filtered[Math.ceil(n/2)])/2);
	
		return { mean: amean, median: median, stddev: std_dev, stderr: std_err };
	},
	
	calc_bw: function()
	{
		var	i, j, n=0,
			r, bandwidths=[], bandwidths_corrected=[],
			sum=0, sumsq=0, sum_corrected=0, sumsq_corrected=0,
			amean, std_dev, std_err, median,
			amean_corrected, std_dev_corrected, std_err_corrected, median_corrected,
			nimgs, bw, bw_c;
	
		for(i=0; i<this.nruns; i++) {
			if(!this.results[i] || !this.results[i].r) {
				continue;
			}
	
			r=this.results[i].r;
	
			// the next loop we iterate through backwards and only consider the largest 3 images that succeeded
			// that way we don't consider small images that downloaded fast without really saturating the network
			nimgs=0;
			for(j=r.length-1; j>=0 && nimgs<3; j--) {
				if(typeof r[j] === 'undefined') {	// if we hit an undefined image time, it means we skipped everything before this
					break;
				}
				if(r[j].t === null) {
					continue;
				}
	
				n++;
				nimgs++;
	
				bw = images[j].size*1000/r[j].t;	// multiply by 1000 since t is in milliseconds and not seconds
				bandwidths.push(bw);
	
				bw_c = images[j].size*1000/(r[j].t - this.latency.mean);
				bandwidths_corrected.push(bw_c);
			}
		}
	
		this.debug('got ' + n + ' readings');
	
		this.debug('bandwidths: ' + bandwidths);
		this.debug('corrected: ' + bandwidths_corrected);
	
		// First do IQR filtering since we use the median here and should use the stddev after filtering.
		if(bandwidths.length > 3) {
			bandwidths = this.iqr(bandwidths.sort(this.ncmp));
			bandwidths_corrected = this.iqr(bandwidths_corrected.sort(this.ncmp));
		} else {
			bandwidths = bandwidths.sort(this.ncmp);
			bandwidths_corrected = bandwidths_corrected.sort(this.ncmp);
		}
	
		this.debug('after iqr: ' + bandwidths);
		this.debug('corrected: ' + bandwidths_corrected);
	
		// Now get the mean & median.  Also get corrected values that eliminate latency
		n = Math.max(bandwidths.length, bandwidths_corrected.length);
		for(i=0; i<n; i++) {
			if(i<bandwidths.length) {
				sum += bandwidths[i];
				sumsq += Math.pow(bandwidths[i], 2);
			}
			if(i<bandwidths_corrected.length) {
				sum_corrected += bandwidths_corrected[i];
				sumsq_corrected += Math.pow(bandwidths_corrected[i], 2);
			}
		}
	
		n = bandwidths.length;
		amean = Math.round(sum/n);
		std_dev = Math.sqrt(sumsq/n - Math.pow(sum/n, 2));
		std_err = Math.round(1.96 * std_dev/Math.sqrt(n));
		std_dev = Math.round(std_dev);
	
		n = bandwidths.length-1;
		median = Math.round((bandwidths[Math.floor(n/2)] + bandwidths[Math.ceil(n/2)])/2);
	
		n = bandwidths_corrected.length;
		amean_corrected = Math.round(sum_corrected/n);
		std_dev_corrected = Math.sqrt(sumsq_corrected/n - Math.pow(sum_corrected/n, 2));
		std_err_corrected = (1.96 * std_dev_corrected/Math.sqrt(n)).toFixed(2);
		std_dev_corrected = std_dev_corrected.toFixed(2);
	
		n = bandwidths_corrected.length-1;
		median_corrected = Math.round((bandwidths_corrected[Math.floor(n/2)] + bandwidths_corrected[Math.ceil(n/2)])/2);
	
		this.debug('amean: ' + amean + ', median: ' + median);
		this.debug('corrected amean: ' + amean_corrected + ', median: ' + median_corrected);
	
		return {
			mean: amean,
			stddev: std_dev,
			stderr: std_err,
			median: median,
			mean_corrected: amean_corrected,
			stddev_corrected: std_dev_corrected,
			stderr_corrected: std_err_corrected,
			median_corrected: median_corrected
		};
	},
	
	defer: function(method)
	{
		var that=this;
		return setTimeout(function() { method.call(that); that=null;}, 10);
	},
	
	load_img: function(i, run, callback)
	{
		var	url = this.base_url + images[i].name + '?t=' + (new Date().getTime()) + Math.random(),
			timer=0, tstart=0,
			img = new Image(),
			that=this;
	
		img.onload=function() { img.onload=img.onerror=null; img=null; clearTimeout(timer); if(callback) { callback.call(that, i, tstart, run, true); } that=callback=null; };
		img.onerror=function() { img.onload=img.onerror=null; img=null; clearTimeout(timer); if(callback) { callback.call(that, i, tstart, run, false); } that=callback=null; };
	
		// the timeout does not abort download of the current image, it just sets an end of loop flag so we don't attempt download of the next image
		// we still need to wait until onload or onerror fire to be sure that the image download isn't using up bandwidth.
		// This also saves us if the timeout happens on the first image.  If it didn't, we'd have nothing to measure.
		timer=setTimeout(function() { if(callback) { callback.call(that, i, tstart, run, null); } }, images[i].timeout + Math.min(400, this.latency ? this.latency.mean : 400));
	
		tstart = new Date().getTime();
		img.src=url;
	},
	
	lat_loaded: function(i, tstart, run, success)
	{
		if(run !== this.latency_runs+1) {
			return;
		}
	
		if(success !== null) {
			var lat = new Date().getTime() - tstart;
			this.latencies.push(lat);
		}
		// if we've got all the latency images at this point, we can calculate latency
		if(this.latency_runs === 0) {
			this.latency = this.calc_latency();
		}
	
		this.defer(this.iterate);
	},
	
	img_loaded: function(i, tstart, run, success)
	{
		if(run !== this.runs_left+1) {
			return;
		}
	
		if(this.results[this.nruns-run].r[i])	{	// already called on this image
			return;
		}
	
		if(success === null) {			// if timeout, then we set the next image to the end of loop marker
			this.results[this.nruns-run].r[i+1] = {t:null, state: null, run: run};
			return;
		}
	
		var result = { start: tstart, end: new Date().getTime(), t: null, state: success, run: run };
		if(success) {
			result.t = result.end-result.start;
		}
		this.results[this.nruns-run].r[i] = result;
	
		// we terminate if an image timed out because that means the connection is too slow to go to the next image
		if(i >= images.end-1 || typeof this.results[this.nruns-run].r[i+1] !== 'undefined') {
			this.debug(this.results[this.nruns-run]);
			// First run is a pilot test to decide what the largest image that we can download is
			// All following runs only try to download this image
			if(run === this.nruns) {
				images.start = i;
			}
			this.defer(this.iterate);
		} else {
			this.load_img(i+1, run, this.img_loaded);
		}
	},
	
	finish: function()
	{
		if(!this.latency) {
			this.latency = this.calc_latency();
		}
		var	bw = this.calc_bw(),
			o = {
				bw:		bw.median_corrected,
				bw_err:		parseFloat(bw.stderr_corrected, 10),
				lat:		this.latency.mean,
				lat_err:	parseFloat(this.latency.stderr, 10)
			};
	
		BOOMR.addVar(o);
		this.complete = true;
		BOOMR.sendBeacon();
	
		// If we have an IP address we can make the BA cookie persistent for a while because we'll
		// recalculate it if necessary (when the user's IP changes).
		if(!isNaN(o.bw)) {
			BOOMR.utils.setCookie(this.cookie, { ba: Math.round(o.bw), be: o.bw_err, l: o.lat, le: o.lat_err, ip: this.user_ip, t: Math.round(new Date().getTime()/1000) }, (this.user_ip ? this.cookie_exp : 0), "/", null);
		}
	
		this.running = false;
	},
	
	iterate: function()
	{
		if(this.aborted) {
			return false;
		}
	
		if(!this.runs_left) {
			this.finish();
		}
		else if(this.latency_runs) {
			this.load_img('l', this.latency_runs--, this.lat_loaded);
		}
		else {
			this.results.push({r:[]});
			this.load_img(images.start, this.runs_left--, this.img_loaded);
		}
	},

	setVarsFromCookie: function(cookies) {
		var ba = parseInt(cookies.ba, 10),
		    bw_e = parseFloat(cookies.be, 10),
		    lat = parseInt(cookies.l, 10) || 0,
		    lat_e = parseFloat(cookies.le, 10) || 0,
		    c_sn = cookies.ip.replace(/\.\d+$/, '0'),	// Note this is IPv4 only
		    t = parseInt(cookies.t, 10),
		    p_sn = this.user_ip.replace(/\.\d+$/, '0'),

		// We use the subnet instead of the IP address because some people
		// on DHCP with the same ISP may get different IPs on the same subnet
		// every time they log in

		    t_now = Math.round((new Date().getTime())/1000);	// seconds

		// If the subnet changes or the cookie is more than 7 days old,
		// then we recheck the bandwidth, else we just use what's in the cookie
		if(c_sn === p_sn && t >= t_now - this.cookie_exp) {
			this.complete = true;
			BOOMR.addVar({
				'bw': ba,
				'lat': lat,
				'bw_err': bw_e,
				'lat_err': lat_e
			});
		}
	}

};
	
BOOMR.plugins.BW = {
	init: function(config) {
		var bacookie, cookies;

		BOOMR.utils.pluginConfig(impl, config, "BW", ["base_url", "timeout", "nruns", "cookie", "cookie_exp"]);

		if(config && config.user_ip) {
			impl.user_ip = config.user_ip;
		}

		images.start = 0;
		impl.runs_left = impl.nruns;
		impl.latency_runs = 10;
		impl.results = [];
		impl.latencies = [];
		impl.latency = null;
		impl.complete = false;
		impl.aborted = false;

		BOOMR.removeVar('ba', 'ba_err', 'lat', 'lat_err');

		bacookie = BOOMR.utils.getCookie(impl.cookie);
		cookies = BOOMR.utils.getSubCookies(bacookie);

		if(cookies && cookies.ba) {
			impl.setVarsFromCookie(cookies);
		}

		BOOMR.subscribe("page_ready", BOOMR.plugins.BW.run, null, BOOMR.plugins.BW);

		return this;
	},

	run: function() {
		if(impl.running || impl.complete) {
			return this;
		}

		if(w.location.protocol === 'https:') {
			// we don't run the test for https because SSL stuff will mess up b/w calculations
			// we could run the test itself over HTTP, but then IE will complain about
			// insecure resources, so the best is to just bail and hope that the user
			// gets the cookie from some other Y! page

			impl.complete = true;
			return this;
		}

		impl.running = true;

		setTimeout(this.abort, impl.timeout);

		impl.defer(impl.iterate);

		return this;
	},

	abort: function() {
		impl.aborted = true;
		impl.finish();	// we don't defer this call because it might be called from onbeforeunload
				// and we want the entire chain to complete before we return

		return this;
	},

	is_complete: function() { return impl.complete; }
};

}(this, this.document));
// End of BW plugin

/* ---include-plugins-here--- */

BOOMR.fireEvent("script_load");



