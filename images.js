/**
	images.js
	Images plugin.
	This plugin will add RT tracking to all of the images contained on the page
	Requires UTIL plugin
*/

(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};


var impl = {
	complete: false,	// Set when this plugin has completed
	last_image: 0,
	images_poll_id: null,
	image_store: new Object,
	
	getVar: function(v,d){ 
		return v ? v:d 
	},

    imageLoaded: function(e) {
        var i = impl.getObject(e);
        if(i) {
			BOOMR.plugins.RT.endTimer(i.timer)
		}
    },

    imageError: function(e) {
        var i = impl.getObject(e);
        if(i) {
			BOOMR.plugins.RT.endTimer(i.timer)
		}
		// set error flag
    },

    imageAbort: function(e) {
        var i = impl.getObject(e);
        if(i) {
			BOOMR.plugins.RT.endTimer(i.timer)
		}
		// set abort flag
    },

    getObject: function(e) {
        var evt = window.event ? window.event : e;
		var a = BOOMR.plugins.UTIL.searchElement(evt);
		var i;
		i = impl.image_store[a.src || a.href];
        return i;
    },
	
	pollImages: function() {
    	var image_cnt = document.images.length;
        if (image_cnt > impl.last_image) {
            for(var i = impl.last_image; i < image_cnt; ++i) {
                var image_path = document.images[i].src;
                if (image_path) {   
					var timer_name = "t_img_" + i;
					BOOMR.plugins.RT.startTimer(timer_name);
                    impl.image_store[image_path] = new BOOMR.plugins.UTIL.ObjectRecord(timer_name, BOOMR.plugins.UTIL.formatUrl(image_path, 1));
                    BOOMR.plugins.UTIL.addEvent(document.images[i], 'load', impl.imageLoaded, false);
                    BOOMR.plugins.UTIL.addEvent(document.images[i], 'error', impl.imageError, false);
                    BOOMR.plugins.UTIL.addEvent(document.images[i], 'abort', impl.imageAbort, false);  
                }
            }
        }
        impl.last_image = image_cnt;
	},
};
	
BOOMR.plugins.IMGS = {
	init: function(config) {		
		impl.pollImages();
		impl.images_poll_id = setInterval(impl.pollImages, 10);		
		BOOMR.subscribe("page_ready", this.done, null, this);
		return this;
	},
	
	// Called when the page has reached a "usable" state.  This may be when the
	// onload event fires, or it could be at some other moment during/after page
	// load when the page is usable by the user
	done: function() {
		if(impl.images_poll_id) clearInterval(impl.images_poll_id);
		impl.complete = true;
		
		var count=0;
		for(var prop in impl.image_store) {
		    if (impl.image_store.hasOwnProperty(prop)) {
				var timers = BOOMR.plugins.RT.getTimers();
				var start = timers[impl.image_store[prop].timer].start;
				var end = timers[impl.image_store[prop].timer].end;
		        BOOMR.addVar("img_obj_" + count++, impl.image_store[prop].host + '|' + start + '|' + end);
			}
		}
		
		BOOMR.sendBeacon();	// we call sendBeacon() anyway because some other plugin
					// may have blocked waiting for RT to complete
	},
	
	getImageStore: function() {
		return impl.image_store;
	},

	is_complete: function() { return impl.complete; }
};

}(window));
