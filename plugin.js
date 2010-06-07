/**
\file plugin.js
Skeleton template for all boomerang plugins.  Use this code as a starting point for your
own plugins.
*/

(function(w, d) {

// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
if(!BOOMR) {
	BOOMR = {};
}
if(!BOOMR.plugins) {
	BOOMR.plugins = {};
}

// A private object to encapsulate all your implementation details
// This is optional, but the way we recommend you do it.
var O = {
};
	
BOOMR.plugins.MyPlugin = {
	init: function(config) {
		var i, properties = ["prop1", "prop2"];	// list of user configurable properties in O

		// This block is only needed if you actually have user configurable properties
		BOOMR.utils.pluginConfig(O, config, "MyPlugin", properties);

		// Other initialisation code here

		return this;
	},

	// Any other public methods would be defined here

	is_complete: function() {
		// This method should determine if the plugin has completed doing what it
		/// neds to do and return true if so or false otherwise
	}
};

// Subscribe to any BOOMR events here.  Unless your code will explicitly be called by the developer
// or by another plugin, you will need to do this.

}(this, this.document));

