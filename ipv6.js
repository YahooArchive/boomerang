/**
\file ipv6.js
Plugin to measure various ipv6 related metrics.
This plugin tries to do a few things:
- Check if the client can connect to an ipv6 address
- Check if the client can resolve DNS that points to an ipv6 address
- Check latency of connecting to an ipv6 address
- Check latency of doing a host that resolves to an ipv6 address

Naturally you'll need a server that has an ipv6 address, and a DNS name to point to it
*/

// w is the window object
(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var impl = {
	complete: false,
	base_url: "",

	start: function() {
	},

	done: function() {
	}
};
	
BOOMR.plugins.IPv6 = {
	init: function(config) {
		BOOMR.utils.pluginConfig(impl, config, "IPv6", ["base_url"]);

		if(!impl.base_url) {
			BOOMR.warn("IPv6.base_url is not set.  Cannot run IPv6 test.", "ipv6");
			impl.complete = true;	// set to true so that is_complete doesn't
						// block other plugins
			return this;
		}

		// make sure that test images use the same protocol as the host page
		if(w.location.protocol === 'https:') {
			impl.base_url.replace(/^http:/, 'https:');
		}
		else {
			impl.base_url.replace(/^https:/, 'http:');
		}

		BOOMR.subscribe("page_ready", impl.start, null, this);

		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}(window));

