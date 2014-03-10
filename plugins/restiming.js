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
		var p = BOOMR.window.performance, r, data, i = 0;
		if(p && typeof p.getEntriesByType === 'function') {
			r = p.getEntriesByType('resource');
			if (r) {
				BOOMR.info("Client supports Resource Timing API", "rt");
				data = new Array(r.length);
				while (i < r.length) {
					data[i++] = {
						rt_name: r.name,
						rt_type: r.entryType,
						rt_st: r.startTime,
						rt_dur: r.duration,
						rt_red_st: r.redirectStart,
						rt_red_end: r.redirectEnd,
						rt_fet_st: r.fetchStart,
						rt_dns_st: r.domainLookupStart,
						rt_dns_end: r.domainLookupEnd,
						rt_con_st: r.connectStart,
						rt_con_end: r.connectEnd,
						rt_scon_st: r.secureConnectionStart,
						rt_req_st: r.requestStart,
						rt_res_st: r.responseStart,
						rt_res_end: r.responseEnd
					};
				}
				BOOMR.addVar(data);
			}
			this.complete = true;
			BOOMR.sendBeacon();
		}
	}
};

BOOMR.plugins.NavigationTiming = {
	init: function() {
		BOOMR.subscribe("page_ready", impl.done, null, impl);
		return this;
	},
	is_complete: function() {
		return impl.complete;
	}
};

}());

