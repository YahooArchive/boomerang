/**
\file stats_plus.js
Plugin for extending boomerang.js statistics and methods: StatsPlus

Adds:
- Navigator and version info.
- Output format: key - value.
	- For example: http://someurl?key=TEST-KEY-ABCD&value={ "someproperty": "somevalue", "otherproperty": "othervalue" }
	- The goal is to insert this date in a NoSql engine for post-processing the entries.

Instructions:

	- Include boomerang.js in your page (and his plugins, up to you :))
	- Include stats_plus.js and configure some of his values in the boomerang.js initialization:
		BOOMR.init({
			beacon_url: "http://destination_url/_sp.gif",
			StatsPlus: {
				user_code: 'TESTKEY',
				output_format: 'key-value'
			}
		});

*/

// w is the window object
(function(w) {

var d=w.document;

// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

// A private object to encapsulate all your implementation details
// This is optional, but the way we recommend you do it.
var impl = {
	complete: false,

	start: function(){
		impl.getBrowserInfo();
		impl.done();
	},

	getBrowserInfo: function(){
		BOOMR.addVar( "appCodeName", window.navigator.appCodeName );
		BOOMR.addVar( "appName", window.navigator.appName );
		BOOMR.addVar( "appVersion", window.navigator.appVersion );
		BOOMR.addVar( "appBuildID", window.navigator.buildID );
		BOOMR.addVar( "appLanguage", window.navigator.language );
		BOOMR.addVar( "appOsCpu", window.navigator.oscpu );
		BOOMR.addVar( "appPlatform", window.navigator.platform );
	},

	done: function() {
		this.complete = true;
		BOOMR.sendBeacon();
	}
};

BOOMR.plugins.StatsPlus = {
	init: function(config) {
		var i, properties = ["user_code", "output_format"];	// list of user configurable properties in O

		// This block is only needed if you actually have user configurable properties
		BOOMR.utils.pluginConfig(impl, config, "StatsPlus", properties);

		// Other initialisation code here
		impl.user_code = impl.user_code || 'TEST-KEY';
		BOOMR.addVar( "client_code", impl.user_code );

		// Check if we are changing the output format of boomerang:
		if ( impl.output_format != undefined )
		{
			switch( impl.output_format )
			{
				case "key-value":
					BOOMR.formatResponse = function( url, params )
					{
						var i = 0, str_params = [];
						var key_num = new Date().getTime();

						// Add random value to key (avoiding more than one request by milisecond:
						key_num += (function(){
							var text = "-";
							var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
							for( var k = 0; k < 4; k++ )
							{
								text += letters.charAt( Math.floor( Math.random() * letters.length ) );
							}
							return text;
						}());

						// Generating the value part:
						var value = '';
						for( i in params )
						{
							str_params.push( '"' + i + '" : "' + params[i] + '"' );
						}
						url += '?key=' + key_num + '&value=' + encodeURIComponent( '{' + str_params.join( ',' ) + '}' );
						return url;
					}
					break;
			}
		}

		// Subscribe to any BOOMR events here.
		// Unless your code will explicitly be called by the developer
		// or by another plugin, you must to do this.
		BOOMR.subscribe("page_ready", impl.start, null, this);

		return this;
	},

	// Any other public methods would be defined here

	is_complete: function() {
		// This method should determine if the plugin has completed doing what it
		/// needs to do and return true if so or false otherwise
		return impl.complete;
	}
};

}(window));