/**
\file bw.js
Plugin to measure network throughput and latency.
*/

// This is the Bandwidth & Latency plugin abbreviated to BW
// the parameter is the window
(function(w) {

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
], limage = { name: "image-l.gif", size: 35, timeout: 1000 };

// private object
var impl = {
	// properties
	base_url: 'images/',
	timeout: 15000,
	user_ip: '',
	cookie_exp: 7*86400,
	cookie: 'BA',

	latency_runs: 10,
	nruns: 5,

	// results
	latency: null,
	bw: null,

	// state
	aborted: false,
	running: false,

	complete: false,

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
	
	calc_latency: function(latencies)
	{
		var	i, n,
			sum=0, sumsq=0,
			amean, median,
			std_dev, std_err,
			lat_filtered;
	
		// We first do IQR filtering and use the resulting data set
		// for all calculations
		lat_filtered = this.iqr(latencies.sort(this.ncmp));
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
	
	calc_bw: function(latencies, size)
	{
		var	i, n=0,
			bandwidths=[], bandwidths_corrected=[],
			sum=0, sumsq=0, sum_corrected=0, sumsq_corrected=0,
			amean, std_dev, std_err, median,
			amean_corrected, std_dev_corrected, std_err_corrected, median_corrected,
			bw, bw_c;
	
		for(i=0; i<latencies.length; i++) {
			// multiply by 1000 since t is in milliseconds and not seconds
			bw = size*1000/latencies[i];
			bandwidths.push(bw);
	
			bw_c = size*1000/(latencies[i] - this.latency.mean);
			bandwidths_corrected.push(bw_c);
		}
	
		BOOMR.debug('got ' + i + ' readings', "bw");
	
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
	
	finish: function()
	{
		var	o = {
				bw:		this.bw.median_corrected,
				bw_err:		parseFloat(this.bw.stderr_corrected, 10),
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
	
	test_latency: function(t, o)
	{
		if(!o) {
			o = { ctr: 0, state: [] };
		}

		if(t && !t.timeout && t.success) {
			o.state.push(t.end - t.start);
		}

		if(o.ctr < this.latency_runs) {
			o.ctr++;
			BOOMR.utils.loadImage(
					this.base_url + limage.name,
					limage.timeout,
					this.test_latency, this, o
			);
		}
		else {
			this.latency = this.calc_latency(o.state);
			this.iterate();
		}
	},

	test_bandwidth: function(t, o)
	{
		if(!o) {
			o = { i: 0, state: [], ctr: 0 };
		}

		if(t) {
			// terminate on failure
			if(t.success === false) {
				BOOMR.warn("error fetching bandwidth image", "bw");
				return;
			}
			// if not timed out, we go to the next image
			if(!t.timeout && o.i < images.length-1) {
				o.i++;
			}
			// at this point it either timed out or we're at the last image
			else {
				o.state.push(t.end - t.start);
				o.ctr++;
			}
		}

		// first run through each image until the first that timesout
		if(o.ctr < this.nruns) {
			BOOMR.utils.loadImage(
					this.base_url + images[o.i].name,
					images[o.i].timeout,
					this.test_bandwidth, this, o
			);
		}
		else {
			this.bw = this.calc_bw(o.state, images[o.i].size);
			this.iterate();
		}
	},

	iterate: function()
	{
		var which;

		if(!this.iteration_state) {
			this.iteration_state = arguments;
		}

		if(this.aborted) {
			return false;
		}
	
		if(this.iteration_state.length === 0) {
			return this.finish();
		}

		which = Array.prototype.shift.call(this.iteration_state);

		this["test_" + which].call(this);
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
		// every time they log in.  The back end should really be doing this

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

		impl.latency = null;
		impl.bw = null;
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

		impl.iterate('latency', 'bandwidth');

		return this;
	},

	abort: function() {
		if(impl.running) {
			impl.aborted = true;
			impl.finish();
		}

		return this;
	},

	is_complete: function() { return impl.complete; }
};

}(window));
// End of BW plugin


