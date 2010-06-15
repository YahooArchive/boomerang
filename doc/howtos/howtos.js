// Since we don't set a beacon_url, we'll just subscribe to the before_beacon function
// and print the results into the browser itself.
BOOMR.subscribe('before_beacon', function(o) {
	var html = "";
	if(o.t_done) { html += "This page took " + o.t_done + " ms to load<br>"; }
	if(o.t_other) {
		var t_other = o.t_other.split(',');
		html += "Other timers measured: <br>";
		for(var i=0; i<t_other.length; i++) {
			html += "&nbsp;&nbsp;&nbsp;" + t_other[i].replace('|', ' = ') + " ms<br>";
		}
	}
	if(o.bw) { html += "Your bandwidth to this server is " + parseInt(o.bw/1024) + "kbps (&#x00b1;" + parseInt(o.bw_err*100/o.bw) + "%)<br>"; }
	if(o.lat) { html += "Your latency to this server is " + parseInt(o.lat) + "&#x00b1;" + o.lat_err + "ms<br>"; }

	document.getElementById('results').innerHTML = html;
});

