/**
	util.js
	Util plugin.
	This plugin provides utility functions used by other plugins
*/

(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var impl = {
	complete: true,	// Set when this plugin has completed
	bIE: false,
};
	
BOOMR.plugins.UTIL = {
	init: function(config) {		
		BOOMR.sendBeacon();	// we call sendBeacon() anyway because some other plugin
					// may have blocked waiting for RT to complete
	},
	
	ObjectRecord: function(timer_name, host) {
		this.timer = timer_name;
		this.host = host;
	},
	
    searchElement: function(evt) {
        if(impl.bIE) {
			return evt.srcElement || {};
		}
		else {
			return evt.currentTarget || evt.target || {};
		}
    },
	
    addEvent: function(element, evnt_name, callback, useCapture) {
        var n = 'on' + evnt_name;  
        if (element.addEventListener) {
			element.addEventListener(evnt_name, callback, useCapture);
		}
        else if (element.attachEvent) {
			element.attachEvent(n, callback);
		}
        else {
            var x = element[n];
            if (typeof element[n] != 'function') {
				element[n] = callback;
			}
            else {
				element[n] = function(a) { x(a); callback(a); };
			}
        }
    },

	// returns the hostname portion of the url passed in
    formatUrl: function(url, t) {
        try {
            if (url) {
                if (!/(^http|^https)/.test(url)) {
                    if(t == 1) {
						return filterHost(location.hostname);
					}
                    else {
						return url;
					}
                }
                var p = new RegExp('(^http|^https|):\/{2}([^\?#;]*)');
                if (t == 1) {
					p = new RegExp('(^http|^https|):\/{2}([^\/\?]*)');
				}
                var r = url.match(p);
                if (r && t == 1) {
					return this.filterHost(r[2]);
				} 
				else if (r) {
					return r[0];
				}
            }
            return null;
        }
        catch(e) { return null; }
    },

    filterHost: function(h) {
        if (h) {
            if (h.indexOf('<')!=-1 || h.indexOf('%3C')!=-1 || h.indexOf('%3c')!=-1) {
				return null;
			}
            if (window.decodeURIComponent) {
				return decodeURIComponent(h);
			}
            else {
				return unescape(h);
			}
        }
        return null;
    },

	is_complete: function() { return impl.complete; }
};

}(window));