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
// the parameter is the window
(function(w) {

var impl, boomr, k, d=w.document;

// Short namespace because I don't want to keep typing BOOMERANG
if(typeof BOOMR === "undefined") {
	BOOMR = {};
}
// don't allow this code to be included twice
if(BOOMR.version) {
	return;
}

BOOMR.version = "0.9";


// impl is a private object not reachable from outside the BOOMR object
// users can set properties by passing in to the init() method
impl = {
	// properties
	beacon_url: "",
	// strip out everything except last two parts of hostname.
	// This doesn't work well for domains that end with a country tld,
	// but we allow the developer to override site_domain for that.
	site_domain: w.location.hostname.
				replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').
				toLowerCase(),
	//! User's ip address determined on the server.  Used for the BA cookie
	user_ip: '',

	events: {
		"page_ready": [],
		"page_unload": [],
		"visibility_changed": [],
		"before_beacon": []
	},

	vars: {},

	disabled_plugins: {},

	fireEvent: function(e_name, data) {
		var i, h, e;
		if(!this.events.hasOwnProperty(e_name)) {
			return false;
		}

		e = this.events[e_name];

		for(i=0; i<e.length; i++) {
			h = e[i];
			h[0].call(h[2], data, h[1]);
		}

		return true;
	},

	addListener: function(el, sType, fn, capture) {
		if(el.addEventListener) {
			el.addEventListener(sType, fn, (capture));
		}
		else if(el.attachEvent) {
			el.attachEvent("on" + sType, fn);
		}
	}
};


// We create a boomr object and then copy all its properties to BOOMR so that
// we don't overwrite anything additional that was added to BOOMR before this
// was called... for example, a plugin.
boomr = {
	// Utility functions
	utils: {
		getCookie: function(name) {
			if(!name) {
				return null;
			}

			name = ' ' + name + '=';

			var i, cookies;
			cookies = ' ' + d.cookie + ';';
			if ( (i=cookies.indexOf(name)) >= 0 ) {
				i += name.length;
				cookies = cookies.substring(i, cookies.indexOf(';', i));
				return cookies;
			}

			return null;
		},

		setCookie: function(name, subcookies, max_age, path, domain, sec) {
			var value = "",
				k, nameval, c,
				exp = "";

			if(!name) {
				return false;
			}

			for(k in subcookies) {
				if(subcookies.hasOwnProperty(k)) {
					value += '&' + encodeURIComponent(k)
							+ '=' + encodeURIComponent(subcookies[k]);
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
				((typeof domain !== "undefined") ? "; domain="
						+ (domain !== null ? domain : impl.site_domain ) : "") +
				((sec) ? "; secure" : "");

			if ( nameval.length < 4000 ) {
				d.cookie = c;
				// confirm cookie was set (could be blocked by user's settings, etc.)
				return ( value === this.getCookie(name) );
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

		pluginConfig: function(o, config, plugin_name, properties) {
			var i, props=0;

			if(!config || !config[plugin_name]) {
				return false;
			}

			for(i=0; i<properties.length; i++) {
				if(typeof config[plugin_name][properties[i]] !== "undefined") {
					o[properties[i]] = config[plugin_name][properties[i]];
					props++;
				}
			}

			return (props>0);
		}
	},

	init: function(config) {
		var i, k,
			properties = ["beacon_url", "site_domain", "user_ip"];

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
		if(!this.log) {
			this.log = function(m,l,s) { };
		}

		for(k in this.plugins) {
			// config[pugin].enabled has been set to false
			if( config[k]
				&& typeof config[k].enabled !== "undefined"
				&& config[k].enabled === false
			) {
				impl.disabled_plugins[k] = 1;
				continue;
			}
			else if(impl.disabled_plugins[k]) {
				delete impl.disabled_plugins[k];
			}

			// plugin exists and has an init method
			if(this.plugins.hasOwnProperty(k)
				&& typeof this.plugins[k].init === "function"
			) {
				this.plugins[k].init(config);
			}
		}

		// The developer can override onload by setting autorun to false
		if(typeof config.autorun === "undefined" || config.autorun !== false) {
			impl.addListener(w, "load",
						function() {
							impl.fireEvent("page_ready");
						}
					);
		}

		// webkitvisibilitychange is useful to detect if the page loaded through prerender
		impl.addListener(d, "webkitvisibilitychange",
						function() {
							impl.fireEvent("visibility_changed");
						}
				);
		// This must be the last one to fire
		impl.addListener(w, "unload", function() { w=null; });

		return this;
	},

	// The page dev calls this method when they determine the page is usable.
	// Only call this if autorun is explicitly set to false
	page_ready: function() {
		impl.fireEvent("page_ready");
		return this;
	},

	subscribe: function(e_name, fn, cb_data, cb_scope) {
		var i, h, e;

		if(!impl.events.hasOwnProperty(e_name)) {
			return this;
		}

		e = impl.events[e_name];

		// don't allow a handler to be attached more than once to the same event
		for(i=0; i<e.length; i++) {
			h = e[i];
			if(h[0] === fn && h[1] === cb_data && h[2] === cb_scope) {
				return this;
			}
		}
		e.push([ fn, cb_data || {}, cb_scope || null ]);

		// Attach unload handlers directly to the window.onunload and
		// window.onbeforeunload events. The first of the two to fire will clear
		// fn so that the second doesn't fire. We do this because technically
		// onbeforeunload is the right event to fire, but all browsers don't
		// support it.  This allows us to fall back to onunload when onbeforeunload
		// isn't implemented
		if(e_name === 'page_unload') {
			impl.addListener(w, "unload",
						function() {
							if(fn) {
								fn.call(cb_scope, null, cb_data);
							}
							fn=cb_scope=cb_data=null;
						}
					);
			impl.addListener(w, "beforeunload",
						function() {
							if(fn) {
								fn.call(cb_scope, null, cb_data);
							}
							fn=cb_scope=cb_data=null;
						}
					);
		}

		return this;
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
		var i, params;
		if(!arguments.length) {
			return this;
		}

		if(arguments.length === 1
				&& Object.prototype.toString.apply(arguments[0]) === "[object Array]") {
			params = arguments[0];
		}
		else {
			params = arguments;
		}

		for(i=0; i<params.length; i++) {
			if(impl.vars.hasOwnProperty(params[i])) {
				delete impl.vars[params[i]];
			}
		}

		return this;
	},

	sendBeacon: function() {
		var k, url, img, nparams=0, params = [];

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
		impl.fireEvent("before_beacon", impl.vars);

		// Don't send a beacon if no beacon_url has been set
		if(!impl.beacon_url) {
			return this;
		}

		// use document.URL instead of location.href because of a safari bug
		url = impl.beacon_url;
		params['v'] = encodeURIComponent( BOOMR.version );
		params['u'] = encodeURIComponent( d.URL.replace( /#.*/, '' ) );

		for(k in impl.vars) {
			if(impl.vars.hasOwnProperty(k)) {
				nparams++;
				params[encodeURIComponent(k)] = encodeURIComponent( impl.vars[k] );
			}
		}

		// Creating the url format for sending to the endpoint:
		url = this.formatResponse( url, params );

		// only send beacon if we actually have something to beacon back
		if(nparams) {
			img = new Image();
			img.src=url;
		}

		return this;
	},

	formatResponse: function( url, params )
	{
		var i = 0, str_params = [];
		for( i  in params )
		{
			str_params.push( i + '=' + params[i] );
		}
		url += '?' + str_params.join('&');
		return url;
	}

};

var make_logger = function(l) {
	return function(m, s) {
		this.log(m, l, "boomerang" + (s?"."+s:"")); return this;
	};
};

boomr.debug = make_logger("debug");
boomr.info = make_logger("info");
boomr.warn = make_logger("warn");
boomr.error = make_logger("error");

if(w.YAHOO && w.YAHOO.widget && w.YAHOO.widget.Logger) {
	boomr.log = w.YAHOO.log;
}
else if(typeof w.Y !== "undefined" && typeof w.Y.log !== "undefined") {
	boomr.log = w.Y.log;
}
else if(typeof console !== "undefined" && typeof console.log !== "undefined") {
	boomr.log = function(m,l,s) { console.log(s + ": [" + l + "] ", m); };
}


for(k in boomr) {
	if(boomr.hasOwnProperty(k)) {
		BOOMR[k] = boomr[k];
	}
}

BOOMR.plugins = BOOMR.plugins || {};

}(window));

// end of boomerang beaconing section
// Now we start built in plugins.

// This is the Bandwidth & Latency plugin abbreviated to BW
// the parameter is the window
(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

// We choose image sizes so that we can narrow down on a bandwidth range as
// soon as possible the sizes chosen correspond to bandwidth values of
// 14-64kbps, 64-256kbps, 256-1024kbps, 1-2Mbps, 2-8Mbps, 8-30Mbps & 30Mbps+
// Anything below 14kbps will probably timeout before the test completes
// Anything over 60Mbps will probably be unreliable since latency will make up
// the largest part of download time. If you want to extend this further to
// cover 100Mbps & 1Gbps networks, use image sizes of 19,200,000 & 153,600,000
// bytes respectively
// See https://spreadsheets.google.com/ccc?key=0AplxPyCzmQi6dDRBN2JEd190N1hhV1N5cHQtUVdBMUE&hl=en_GB
// for a spreadsheet with the details
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

// abuse arrays to do the latency test simply because it avoids a bunch of
// branches in the rest of the code.
// I'm sorry Douglas
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

	// numeric comparator.  Returns negative number if a < b, positive if a > b and 0 if they're equal
	// used to sort an array numerically
	ncmp: function(a, b) { return (a-b); },

	// Calculate the interquartile range of an array of data points
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

		// We first do IQR filtering and use the resulting data set
		// for all calculations
		lat_filtered = this.iqr(this.latencies.sort(this.ncmp));
		n = lat_filtered.length;

		BOOMR.debug(lat_filtered, "bw");

		// First we get the arithmetic mean, standard deviation and standard error
		// We ignore the first since it paid the price of DNS lookup, TCP connect
		// and slow start
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

		median = Math.round(
				(lat_filtered[Math.floor(n/2)] + lat_filtered[Math.ceil(n/2)]) / 2
			);

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

			// the next loop we iterate through backwards and only consider the largest
			// 3 images that succeeded that way we don't consider small images that
			// downloaded fast without really saturating the network
			nimgs=0;
			for(j=r.length-1; j>=0 && nimgs<3; j--) {
				// if we hit an undefined image time, we skipped everything before this
				if(typeof r[j] === 'undefined') {
					break;
				}
				if(r[j].t === null) {
					continue;
				}

				n++;
				nimgs++;

				// multiply by 1000 since t is in milliseconds and not seconds
				bw = images[j].size*1000/r[j].t;
				bandwidths.push(bw);

				bw_c = images[j].size*1000/(r[j].t - this.latency.mean);
				bandwidths_corrected.push(bw_c);
			}
		}

		BOOMR.debug('got ' + n + ' readings', "bw");

		BOOMR.debug('bandwidths: ' + bandwidths, "bw");
		BOOMR.debug('corrected: ' + bandwidths_corrected, "bw");

		// First do IQR filtering since we use the median here
		// and should use the stddev after filtering.
		if(bandwidths.length > 3) {
			bandwidths = this.iqr(bandwidths.sort(this.ncmp));
			bandwidths_corrected = this.iqr(bandwidths_corrected.sort(this.ncmp));
		} else {
			bandwidths = bandwidths.sort(this.ncmp);
			bandwidths_corrected = bandwidths_corrected.sort(this.ncmp);
		}

		BOOMR.debug('after iqr: ' + bandwidths, "bw");
		BOOMR.debug('corrected: ' + bandwidths_corrected, "bw");

		// Now get the mean & median.
		// Also get corrected values that eliminate latency
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
		median = Math.round(
				(bandwidths[Math.floor(n/2)] + bandwidths[Math.ceil(n/2)]) / 2
			);

		n = bandwidths_corrected.length;
		amean_corrected = Math.round(sum_corrected/n);
		std_dev_corrected = Math.sqrt(sumsq_corrected/n - Math.pow(sum_corrected/n, 2));
		std_err_corrected = (1.96 * std_dev_corrected/Math.sqrt(n)).toFixed(2);
		std_dev_corrected = std_dev_corrected.toFixed(2);

		n = bandwidths_corrected.length-1;
		median_corrected = Math.round(
					(
						bandwidths_corrected[Math.floor(n/2)]
						+ bandwidths_corrected[Math.ceil(n/2)]
					) / 2
				);

		BOOMR.debug('amean: ' + amean + ', median: ' + median, "bw");
		BOOMR.debug('corrected amean: ' + amean_corrected + ', '
				+ 'median: ' + median_corrected, "bw");

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
		var url = this.base_url + images[i].name
			+ '?t=' + (new Date().getTime()) + Math.random(),
			timer=0, tstart=0,
			img = new Image(),
			that=this;

		img.onload=function() {
			img.onload=img.onerror=null;
			img=null;
			clearTimeout(timer);
			if(callback) {
				callback.call(that, i, tstart, run, true);
			}
			that=callback=null;
		};
		img.onerror=function() {
			img.onload=img.onerror=null;
			img=null;
			clearTimeout(timer);
			if(callback) {
				callback.call(that, i, tstart, run, false);
			}
			that=callback=null;
		};

		// the timeout does not abort download of the current image, it just sets an
		// end of loop flag so we don't attempt download of the next image we still
		// need to wait until onload or onerror fire to be sure that the image
		// download isn't using up bandwidth.  This also saves us if the timeout
		// happens on the first image.  If it didn't, we'd have nothing to measure.
		timer=setTimeout(function() {
					if(callback) {
						callback.call(that, i, tstart, run, null);
					}
				},
				images[i].timeout
					+ Math.min(400, this.latency ? this.latency.mean : 400)
			);

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
		// if we've got all the latency images at this point,
		// so we can calculate latency
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

		// if timeout, then we set the next image to the end of loop marker
		if(success === null) {
			this.results[this.nruns-run].r[i+1] = {t:null, state: null, run: run};
			return;
		}

		var result = {
				start: tstart,
				end: new Date().getTime(),
				t: null,
				state: success,
				run: run
			};
		if(success) {
			result.t = result.end-result.start;
		}
		this.results[this.nruns-run].r[i] = result;

		// we terminate if an image timed out because that means the connection is
		// too slow to go to the next image
		if(i >= images.end-1
			|| typeof this.results[this.nruns-run].r[i+1] !== 'undefined'
		) {
			BOOMR.debug(this.results[this.nruns-run], "bw");
			// First run is a pilot test to decide what the largest image
			// that we can download is. All following runs only try to
			// download this image
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
				lat_err:	parseFloat(this.latency.stderr, 10),
				bw_time:	Math.round(new Date().getTime()/1000)
			};

		BOOMR.addVar(o);

		// If we have an IP address we can make the BA cookie persistent for a while
		// because we'll recalculate it if necessary (when the user's IP changes).
		if(!isNaN(o.bw)) {
			BOOMR.utils.setCookie(this.cookie,
						{
							ba: Math.round(o.bw),
							be: o.bw_err,
							l:  o.lat,
							le: o.lat_err,
							ip: this.user_ip,
							t:  o.bw_time
						},
						(this.user_ip ? this.cookie_exp : 0),
						"/",
						null
				);
		}

		this.complete = true;
		BOOMR.sendBeacon();
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

			return true;
		}

		return false;
	}

};

BOOMR.plugins.BW = {
	init: function(config) {
		var cookies;

		BOOMR.utils.pluginConfig(impl, config, "BW",
						["base_url", "timeout", "nruns", "cookie", "cookie_exp"]);

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

		cookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(impl.cookie));

		if(!cookies || !cookies.ba || !impl.setVarsFromCookie(cookies)) {
			BOOMR.subscribe("page_ready", this.run, null, this);
		}

		return this;
	},

	run: function() {
		if(impl.running || impl.complete) {
			return this;
		}

		if(w.location.protocol === 'https:') {
			// we don't run the test for https because SSL stuff will mess up b/w
			// calculations we could run the test itself over HTTP, but then IE
			// will complain about insecure resources, so the best is to just bail
			// and hope that the user gets the cookie from some other page

			BOOMR.info("HTTPS detected, skipping bandwidth test", "bw");
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
		if (impl.running) {
			impl.finish();	// we don't defer this call because it might be called from
					// onunload and we want the entire chain to complete
					// before we return
		}
		return this;
	},

	is_complete: function() { return impl.complete; }
};

}(window));
// End of BW plugin



/*jslint white: false, devel: true, onevar: true, browser: true, undef: true, nomen: true, regexp: false, continue: true, plusplus: false, bitwise: false, newcap: true, maxerr: 50, indent: 4 */
