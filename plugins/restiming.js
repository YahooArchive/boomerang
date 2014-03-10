/**
\file restiming.js
Plugin to collect metrics from the W3C Resource Timing API.
For more information about Navigation Timing,
see: http://www.w3.org/TR/resource-timing/
*/

(function() {

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var impl = {
	complete: false,
	done: function() {
		var p = BOOMR.window.performance, r, data, i;
		if(p && typeof p.getEntriesByType === 'function') {
			r = p.getEntriesByType('resource');
			if(r) {
				BOOMR.info("Client supports Resource Timing API", "rt");
				data = {
					restiming: new Array(r.length)
				};
				for(i = 0; i < r.length; ++i) {
					data.restiming[i] = {
						rt_name: r[i].name,
						rt_type: r[i].entryType,
						rt_st: r[i].startTime,
						rt_dur: r[i].duration,
						rt_red_st: r[i].redirectStart,
						rt_red_end: r[i].redirectEnd,
						rt_fet_st: r[i].fetchStart,
						rt_dns_st: r[i].domainLookupStart,
						rt_dns_end: r[i].domainLookupEnd,
						rt_con_st: r[i].connectStart,
						rt_con_end: r[i].connectEnd,
						rt_scon_st: r[i].secureConnectionStart,
						rt_req_st: r[i].requestStart,
						rt_res_st: r[i].responseStart,
						rt_res_end: r[i].responseEnd
					};
				}
				BOOMR.addVar(data);
			}
			this.complete = true;
			BOOMR.sendBeacon();
		}
	}
};

BOOMR.plugins.ResourceTiming = {
	init: function() {
		BOOMR.subscribe("page_ready", impl.done, null, impl);
		return this;
	},
	is_complete: function() {
		return impl.complete;
	}
};

}());

