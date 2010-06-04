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
			this.utils.addListener(w, "load", function() { this.page_loaded(); });
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
		BMR.log(msg, "error", "boomerang.rt");
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

	is_complete: function() { return rt.complete; }

};

BMR.subscribe("page_load", BMR.RT.done, null, BMR.RT);
BMR.subscribe("page_unload", BMR.RT.start, null, BMR.RT);

}(this, this.document));
// End of RT plugin

// This is the BW plugin
// the two parameters are the window and document objects
(function(w, d) {

// private object
var bw = {
	base_url: '',
	timeout: 15000,
	nruns: 5,
	latency_runs: 10
};

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

var nimages = images.length;
var smallest_image = 0;

// abuse arrays to do the latency test simply because it avoids a bunch of branches in the rest of the code
images['l'] = { name: "image-l.gif", size: 35, timeout: 1000 };

var results = [],
    latencies = [],
    latency = null,
    runs_left = bw.nruns,
    aborted = false,
    complete = false,
    test_start = null;


BMR.plugins.BW = {
	init: function(config) {
		var i, properties = ["base_url", "timeout", "nruns", "latency_runs"];

		if(typeof config !== "undefined" && typeof config.BW !== "undefined") {
			for(i=0; i<config.BW.length; i++) {
				if(typeof config.BW[properties[i]] !== "undefined") {
					bw[properties[i]] = config.BW[properties[i]];
				}
			}
		}

		runs_left = bw.nruns;
		latency_runs = 10;
		smallest_image = 0;
		results = [];
		latencies = [];
		latency = null;
		complete = false;
		aborted = false;
		test_start = null;
	},

	run: function() {
		setTimeout(BMR.plugins.BW.abort, bw.timeout);

		test_start = new Date().getTime();
		defer(iterate);
	},

	abort: function() {
		aborted = true;
		finish();	// we don't defer this call because it might be called from onbeforeunload
				// and we want the entire chain to complete before we return
	},

	is_complete: function() { return complete; }
};

var ncmp = function(a, b) { return (a-b); };

var iqr = function(a)
{
	var l = a.length-1;
	var q1 = (a[Math.floor(l*0.25)] + a[Math.ceil(l*0.25)])/2;
	var q3 = (a[Math.floor(l*0.75)] + a[Math.ceil(l*0.75)])/2;

	var fw = (q3-q1)*1.5;

	var b=[];

	l++;

	for(var i=0; i<l && a[i] < q3+fw; i++) {
		if(a[i] > q1-fw) {
			b.push(a[i]);
		}
	}

	return b;
};

var debug = function(msg)
{
	BMR.log(msg, "debug", "boomerang.bw");
};

var defer = function(method)
{
	return setTimeout(method, 10);
};

var iterate = function()
{
	if(aborted) {
		return false;
	}

	if(!runs_left) {
		finish();
	}
	else if(latency_runs) {
		load_img('l', latency_runs--, lat_loaded);
	}
	else {
		results.push({r:[]});
		load_img(smallest_image, runs_left--, img_loaded);
	}
};

var load_img = function(i, run, callback)
{
	var url = base_url + images[i].name + '?t=' + (new Date().getTime()) + Math.random();
	var timer=0, tstart=0;
	var img = new Image();

	img.onload=function() { img=null; clearTimeout(timer); if(callback) callback(i, tstart, run, true); callback=null; };
	img.onerror=function() { img=null; clearTimeout(timer); if(callback) callback(i, tstart, run, false); callback=null; };

	// the timeout does not abort download of the current image, it just sets an end of loop flag so we don't attempt download of the next image
	// we still need to wait until onload or onerror fire to be sure that the image download isn't using up bandwidth.
	// This also saves us if the timeout happens on the first image.  If it didn't, we'd have nothing to measure.
	timer=setTimeout(function() { if(callback) callback(i, tstart, run, null); }, images[i].timeout + Math.min(400, latency ? latency.mean : 400));

	tstart = new Date().getTime();
	img.src=url;
};

var lat_loaded = function(i, tstart, run, success)
{
	if(run != latency_runs+1)
		return;

	if(success !== null) {
		var lat = new Date().getTime() - tstart;
		latencies.push(lat);
	}
	// if we've got all the latency images at this point, we can calculate latency
	if(latency_runs === 0) {
		latency = calc_latency();
	}

	defer(iterate);
};

var img_loaded = function(i, tstart, run, success)
{
	if(run != runs_left+1)
		return;

	if(results[nruns-run].r[i])		// already called on this image
		return;

	if(success === null) {			// if timeout, then we set the next image to the end of loop marker
		results[nruns-run].r[i+1] = {t:null, state: null, run: run};
		return;
	}

	var result = { start: tstart, end: new Date().getTime(), t: null, state: success, run: run };
	if(success) {
		result.t = result.end-result.start;
	}
	results[nruns-run].r[i] = result;

	// we terminate if an image timed out because that means the connection is too slow to go to the next image
	if(i >= nimages-1 || typeof results[nruns-run].r[i+1] !== 'undefined') {
		debug(results[nruns-run]);
		// First run is a pilot test to decide what the largest image that we can download is
		// All following runs only try to download this image
		if(run === nruns) {
			smallest_image = i;
		}
		defer(iterate);
	} else {
		load_img(i+1, run, img_loaded);
	}
};

var calc_latency = function()
{
	var	i, n,
		sum=0, sumsq=0,
		amean, median,
		std_dev, std_err;

	// We first do IQR filtering and use the resulting data set for all calculations
	var lat_filtered = iqr(latencies.sort(ncmp));
	n = lat_filtered.length;

	debug(lat_filtered);

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
};

var calc_bw = function(latency)
{
	var	i, j, n=0,
		r, bandwidths=[], bandwidths_corrected=[],
		sum=0, sumsq=0, sum_corrected=0, sumsq_corrected=0,
		amean, std_dev, std_err, median,
		amean_corrected, std_dev_corrected, std_err_corrected, median_corrected;

	for(i=0; i<nruns; i++) {
		if(!results[i] || !results[i].r) {
			continue;
		}

		r=results[i].r;

		// the next loop we iterate through backwards and only consider the largest 3 images that succeeded
		// that way we don't consider small images that downloaded fast without really saturating the network
		var nimgs=0;
		for(j=r.length-1; j>=0 && nimgs<3; j--) {
			if(typeof r[j] === 'undefined')	// if we hit an undefined image time, it means we skipped everything before this
				break;
			if(r[j].t === null)
				continue;

			n++;
			nimgs++;

			var bw = images[j].size*1000/r[j].t;
			bandwidths.push(bw);

			var bw_c = images[j].size*1000/(r[j].t - latency);
			bandwidths_corrected.push(bw_c);
		}
	}

	debug('got ' + n + ' readings');

	debug('bandwidths: ' + bandwidths);
	debug('corrected: ' + bandwidths_corrected);

	// First do IQR filtering since we use the median here and should use the stddev after filtering.
	if(bandwidths.length > 3) {
		bandwidths = iqr(bandwidths.sort(ncmp));
		bandwidths_corrected = iqr(bandwidths_corrected.sort(ncmp));
	} else {
		bandwidths = bandwidths.sort(ncmp);
		bandwidths_corrected = bandwidths_corrected.sort(ncmp);
	}

	debug('after iqr: ' + bandwidths);
	debug('corrected: ' + bandwidths_corrected);

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

	debug('amean: ' + amean + ', median: ' + median);
	debug('corrected amean: ' + amean_corrected + ', median: ' + median_corrected);

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
};

var finish = function()
{
	if(!latency)
		latency = calc_latency();
	var bw = calc_bw(latency.mean);

	var test_time = new Date().getTime() - test_start;

	var o = {
		bw:		bw.median_corrected,
		bw_err:		parseFloat(bw.stderr_corrected, 10),
		lat:		latency.mean,
		lat_err:	parseFloat(latency.stderr, 10)
	};

	for(var k in o) {
		if(o.hasOwnProperty(k)) {
			BMR.addVar(k, o[k]);
		}
	}

	complete = true;
	BMR.sendBeacon();
};

BMR.subscribe("page_load", BMR.BW.run, null, BMR.BW);

}(this, this.document));
// End of BW plugin


BMR.fireEvent("script_load");



