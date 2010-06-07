/**
\file bw.boomerang.plugin.js
Bandwidth and latency plugin for boomerang
*/
// This is the BW plugin
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
var o_bw = {
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
	
				bw = images[j].size*1000/r[j].t;
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
	
		img.onload=function() { img=null; clearTimeout(timer); if(callback) { callback.call(that, i, tstart, run, true); } that=callback=null; };
		img.onerror=function() { img=null; clearTimeout(timer); if(callback) { callback.call(that, i, tstart, run, false); } that=callback=null; };
	
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
		if(i >= images.n-1 || typeof this.results[this.nruns-run].r[i+1] !== 'undefined') {
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
		    p_sn = o_bw.user_ip.replace(/\.\d+$/, '0'),

		// We use the subnet instead of the IP address because some people
		// on DHCP with the same ISP may get different IPs on the same subnet
		// every time they log in

		    t_now = Math.round((new Date().getTime())/1000);	// seconds

		// If the subnet changes or the cookie is more than 7 days old,
		// then we recheck the bandwidth, else we just use what's in the cookie
		if(c_sn === p_sn && t >= t_now - o_bw.cookie_exp) {
			o_bw.complete = true;
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
		var i, properties = ["base_url", "timeout", "nruns", "cookie", "cookie_exp"],
		    bacookie, cookies;

		if(typeof config !== "undefined" && typeof config.BW !== "undefined") {
			for(i=0; i<properties.length; i++) {
				if(typeof config.BW[properties[i]] !== "undefined") {
					o_bw[properties[i]] = config.BW[properties[i]];
				}
			}
		}

		if(config && config.user_ip) {
			o_bw.user_ip = config.user_ip;
		}

		images.start = 0;
		o_bw.runs_left = o_bw.nruns;
		o_bw.latency_runs = 10;
		o_bw.results = [];
		o_bw.latencies = [];
		o_bw.latency = null;
		o_bw.complete = false;
		o_bw.aborted = false;

		bacookie = BOOMR.utils.getCookie(o_bw.cookie);
		cookies = BOOMR.utils.getSubCookies(bacookie);

		if(cookies && cookies.ba) {
			o_bw.setVarsFromCookie(cookies);
		}

		return this;
	},

	run: function() {
		if(o_bw.running || o_bw.complete) {
			return this;
		}

		if(d.location.protocol === 'https:') {
			// we don't run the test for https because SSL stuff will mess up b/w calculations
			// we could run the test itself over HTTP, but then IE will complain about
			// insecure resources, so the best is to just bail and hope that the user
			// gets the cookie from some other Y! page

			o_bw.complete = true;
			return this;
		}

		o_bw.running = true;

		setTimeout(BOOMR.plugins.BW.abort, o_bw.timeout);

		o_bw.defer(o_bw.iterate);

		return this;
	},

	abort: function() {
		o_bw.aborted = true;
		o_bw.finish();	// we don't defer this call because it might be called from onbeforeunload
				// and we want the entire chain to complete before we return

		return this;
	},

	is_complete: function() { return o_bw.complete; }
};

BOOMR.subscribe("page_ready", BOOMR.plugins.BW.run, null, BOOMR.plugins.BW);

}(this, this.document));
// End of BW plugin


