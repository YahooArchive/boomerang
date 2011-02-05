/**
\file ipv6.js
Plugin to measure various ipv6 related metrics.
This plugin tries to do a few things:
- Check if the client can connect to an ipv6 address
- Check if the client can resolve DNS that points to an ipv6 address
- Check latency of connecting to an ipv6 address
- Check avg latency of doing dns lookup to an ipv6 address (not worstcase)

You'll need a server that has an ipv6 address, and a DNS name to point to it.
Additionally, this server needs to be configured to serve content requested
from the IPv6 address and should not require a virtual host name.  This means
that you probably cannot use shared hosting that puts multiple hosts on the
same IP address.

All beacon parameters are prefixed with ipv6_
*/

// w is the window object
(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

/*
Algorithm:

1. Try to load a sizeless image from an IPv6 host
   - onerror, flag no IPv6 connect support and end
   - onload, measure load time
2. Try to load a sizeless image from a hostname that resolves to an IPv6 address
   - onerror, flag no IPv6 DNS resolver and end
   - onload, measure load time
*/
var impl = {
	complete: false,
	ipv6_url: "",
	host_url: "",

	start: function() {
	},

	done: function() {
	}
};
	
BOOMR.plugins.IPv6 = {
	init: function(config) {
		BOOMR.utils.pluginConfig(impl, config, "IPv6", ["ipv6_url", "host_url"]);

		if(!impl.ipv6_url) {
			BOOMR.warn("IPv6.ipv6_url is not set.  Cannot run IPv6 test.", "ipv6");
			impl.complete = true;	// set to true so that is_complete doesn't
						// block other plugins
			return this;
		}

		if(!impl.host_url) {
			BOOMR.warn("IPv6.host_url is not set.  Will skip hostname test.", "ipv6");
		}

		// make sure that test images use the same protocol as the host page
		if(w.location.protocol === 'https:') {
			impl.ipv6_url = impl.ipv6_url.replace(/^http:/, 'https:');
			impl.host_url = impl.host_url.replace(/^http:/, 'https:');
		}
		else {
			impl.ipv6_url = impl.ipv6_url.replace(/^https:/, 'http:');
			impl.host_url = impl.host_url.replace(/^https:/, 'http:');
		}

		BOOMR.subscribe("page_ready", impl.start, null, this);

		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}(window));

