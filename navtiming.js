/**
\file navtiming.js
Plugin to collect metrics from the W3C Navigation Timing API. For more information about Navigation Timing,
see: http://www.w3.org/TR/navigation-timing/
*/

// w is the window object
(function(w) {

var d=w.document;

// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

// A private object to encapsulate all your implementation details
var impl = {
	complete: false
};
	
BOOMR.plugins.NavigationTiming = {
	init: function(config) {
		BOOMR.subscribe("page_ready", this.done, null, this);
		return this;
	},

	// Any other public methods would be defined here

	is_complete: function() {
		return impl.complete;
	},

	done: function() {
		if(w.performance && w.performance.timing && w.performance.navigation) {
			BOOMR.info("This user agent supports NavigationTiming.", "nt");
			pn = w.performance.navigation;
			pt = w.performance.timing;
			BOOMR.addVar("nt_red_cnt", pn.redirectCount);
			BOOMR.addVar("nt_nav_type", pn.type);
			BOOMR.addVar("nt_nav_st", pt.navigationStart);
			BOOMR.addVar("nt_red_st", pt.redirectStart);
			BOOMR.addVar("nt_red_end", pt.redirectEnd);
			BOOMR.addVar("nt_fet_st", pt.fetchStart);
			BOOMR.addVar("nt_dns_st", pt.domainLookupStart);
			BOOMR.addVar("nt_dns_end", pt.domainLookupEnd);
			BOOMR.addVar("nt_con_st", pt.connectStart);
			if (pt.secureConnectionStart) {
				// secureConnectionStart is OPTIONAL in the spec
				BOOMR.addVar("nt_ssl_st", pt.secureConnectionStart);
			}
			BOOMR.addVar("nt_con_end", pt.connectEnd);
			BOOMR.addVar("nt_req_st", pt.requestStart);
			BOOMR.addVar("nt_res_st", pt.responseStart);
			BOOMR.addVar("nt_res_end", pt.responseEnd);
			BOOMR.addVar("nt_domloading", pt.domLoading);
			BOOMR.addVar("nt_domint", pt.domInteractive);
			BOOMR.addVar("nt_domcontloaded", pt.domContentLoaded);
			BOOMR.addVar("nt_domcomp", pt.domComplete);
			BOOMR.addVar("nt_load_st", pt.loadEventStart);
			BOOMR.addVar("nt_load_end", pt.loadEventEnd);
			BOOMR.addVar("nt_unload_st", pt.unloadEventStart);
			BOOMR.addVar("nt_unload_end", pt.unloadEventEnd);
		}
		impl.complete = true;
		BOOMR.sendBeacon();
	}
};

}(window));

