describe ("BOOMR.utils Tests",function() {
    describe("BOOMR.utils Basic Tests",function() {
	it("Should have an existing BOOMR.utils object",function() {
	    assert.isObject(BOOMR.utils);
	});

	it("Should have an existing Function BOOMR.utils.cleanUpURL()",function() {
	    assert.isFunction(BOOMR.utils.cleanupURL);
	});

	it("Should have an existing Function BOOMR.utils.hashQueryString()",function(){
	    assert.isFunction(BOOMR.utils.hashQueryString);
	});

	it("Should have an existing Function BOOMR.utils.pluginConfig()",function(){
	    assert.isFunction(BOOMR.utils.pluginConfig);
	});
    });

    describe("BOOMR.utils.hashQueryString() function Tests",function() {
	it("Should return undefined when undefined is passwed as argument",function() {
	    assert.isUndefined(BOOMR.utils.hashQueryString());
	});
	
	it("Should return null when null is passed as argument",function() {
	    assert.isNull(BOOMR.utils.hashQueryString(null));
	});

	it("Should return the URL untouched when passed with second argument false",function(){
	    var url = "http://www.example.org/page#/app";
	    assert.equal(BOOMR.utils.hashQueryString(url,false),url);
	});

	it("Should return cleaned URL when passed with second argument true",function() {
	    var url = "http://www.example.org/page#/app";
	    assert.equal(BOOMR.utils.hashQueryString(url,true),url);
	});

	it("Should return empty URL when URL starts with \"/\"",function(){
	    var url = "/page",
		expected = "";
	    assert.equal(BOOMR.utils.hashQueryString(url),expected);
	});
	
	it("Should return empty URL when URL starts with \"/\" and second argument is true",function(){
	    var url = "/page",
		expected = "";
	    assert.equal(BOOMR.utils.hashQueryString(url,true),expected);
	});

	it("Should append a protocol string to the URL when URL starts with \"//\" and second argument is true",function(){
	    var url = "//page",
		expected = window.location.protocol + url;
	    assert.equal(BOOMR.utils.hashQueryString(url,true),expected);
	});

	it("Should hash the parameters in the URL but retain the hash when the second argument is false and 'MD5' was built into BOOMR.utils",function() {
	    var url = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page",
		expected = "http://www.example.org/app/page?bd409219fb3e3fb1a7e7b1e140f55af6#page";
	    
	    assert.equal(BOOMR.utils.hashQueryString(url,false),expected);	    
	});

	it("Should hash the parameters in the URL and remove the hash when the second argument is true and 'MD5' was built into BOOMR.utils",function() {
	    var url = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page",
		expected = "http://www.example.org/app/page?bd409219fb3e3fb1a7e7b1e140f55af6";

	    assert.equal(BOOMR.utils.hashQueryString(url,false),expected);	    
	});
	
	it("Should return the URL when MD5 was not built into BOOMR.utils",function() {
	    var MD5 = BOOMR.utils.MD5;
	    BOOMR.utils.MD5 = false;
	    
	    var url = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page",
		expected = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page";
	    assert.equal(BOOMR.utils.hashQueryString(url,false),expected);
	
	    BOOMR.utils.MD5 = MD5;
	});

    });

    describe("BOOMR.utils.cleanupURL() function Tests",function() {

	
	it("Should return an empty string when no argument is given", function() {
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    assert.equal(BOOMR.utils.cleanupURL(),"");
	    BOOMR = BOOMR_reset;
	});

	it("Should return an empty string when null is passed as argument",function(){
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    assert.equal(BOOMR.utils.cleanupURL(null),"");
	    BOOMR = BOOMR_reset;
	});
	
	it("Should return an empty string when undefined is passed as argument",function(){
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    assert.equal(BOOMR.utils.cleanupURL(undefined),"");
	    BOOMR = BOOMR_reset;
	});

	it("Should return an empty string when false is passed as argument",function(){
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    assert.equal(BOOMR.utils.cleanupURL(false),"");
	    BOOMR = BOOMR_reset;
	});
	
	it("Should return an empty string when an object is passed as argument",function(){
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    assert.equal(BOOMR.utils.cleanupURL({}),"");
	    BOOMR = BOOMR_reset;
	});
	
	it("Should return an empty string when an array is passed as argument",function(){
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    assert.equal(BOOMR.utils.cleanupURL(["a","b"]),"");
	    BOOMR = BOOMR_reset;	
	});
	
	it("Should return the given URL without a parameters string when a URL with prameters is passed as argument",function(){
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    var url = "http://www.example.com/?key=value", 
		expected = "http://www.example.com/?qs-redacted";
	    assert.equal(BOOMR.utils.cleanupURL(url),expected);
	    BOOMR = BOOMR_reset;
	});
	
	it("Should return the given path without parameters when a URL-path with prameters is passed as argument",function(){
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: true
	    });
	    var url = "/app/page?key=value",
	        expected = "/app/page?qs-redacted";
	    assert.equal(BOOMR.utils.cleanupURL(url),expected);
	    BOOMR = BOOMR_reset;
	});
	
	it("Should return original URL when strip_query_string is false",function() {
	    var BOOMR_reset = BOOMR;
	    BOOMR.init({
		strip_query_string: false
	    });
	    var url = "/app/page?key=value",
	        expected = "/app/page?key=value";
	    assert.equal(BOOMR.utils.cleanupURL(url),expected);
	    BOOMR = BOOMR_reset;
	});
	
    });

    describe("BOOMR.utils.objectToString() function Tests",function() {
	it("Should have an existing Function BOOMR.utils.objectToString()",function() {
	    assert.isFunction(BOOMR.utils.objectToString);
	});
	
	it("Should return a string representation of {\"key\": \"value\" } as key=value ",function() {
	    var object = {"key": "value"},
	        expected = "key=value";
	    assert.equal(BOOMR.utils.objectToString(object),expected);
	});
	
	it("Should return a string representation of {\"key\": \"value\", \"key2\": \"value2\" } as seperated by the default seperator (\"\\n\\t\") as key=value,key2=value2",function() {
	    var object = {"key": "value", "key2": "value2"},
	        expected = "key=value\n\tkey2=value2";

	    assert.equal(BOOMR.utils.objectToString(object),expected);
	});

	it("Should return a string representation of {\"key\": \"value\", \"key2\": \"value2\" } as seperated by the custom seperator \"|\" as key=value|key2=value2",function() {
	    var object = {"key": "value", "key2": "value2"},
	        expected = "key=value|key2=value2";

	    assert.equal(BOOMR.utils.objectToString(object,'|'),expected);
	});

	it("Should return a string representation of a nested object as a flat key value string with default seperator(\",\") as key=value\n\tarray=value2%2Cvalue3 ",function() {
	    var object = {"key": "value", "array": ["value2", "value3"]},
	        expected = "key=value\n\tarray=value2%2Cvalue3";
	    assert.equal(BOOMR.utils.objectToString(object),expected);
	});
	
	it("Should return a string representation of a nested array as a flat key value string with default seperator (\",\") as \"1,2,3%2C4,5,6\" ",function () {
	    var object = ["1", 
			  "2",
			  ["3,4"],
			  [
			      ["5","6"]
			  ]
			 ],
	        expected = "1,2,3%2C4,5,6";
	    assert.equal(BOOMR.utils.objectToString(object,null,3),expected);
	});
	
	it("Should escape special characters using encodeURIComponent",function() {
	    var object = { "key": "//file" },
	        expected = "key=%2F%2Ffile";
	    assert.equal(BOOMR.utils.objectToString(object),expected);
	});
    });

    describe("BOOMR.utils.pluginConfig function Tests",function() {

	var pluginName = "myPlugin";

	it("Should return false if no Configuration was set",function(){
	    assert.isFalse(BOOMR.utils.pluginConfig({},{},"",[]));
	});

	it("Should return false if no configuration was set no valid config-keys were defined but a value to a key was requested",function () {
	    var implObject = {},
	    config = {},
	    key = "notExistingKey";
	    assert.isFalse(BOOMR.utils.pluginConfig(implObject,config,pluginName,[]));
	});
	
	it("Should return false if a configuration was set but no valid key from that configuration was requested",function(){
	    var implObject = {},
	    config = { otherPlugin :{ existingKey: "value" } },
	    key = "notExistingKey";
	    assert.isFalse(BOOMR.utils.pluginConfig(implObject,config,pluginName,["existingKey"]));
	});

	it("Should return false if a key was requested that is inbounds to what is expected but was not set by the user",function(){
	    var implObject = {},
	    config = {},
	    key = "existingKey";
	    assert.isFalse(BOOMR.utils.pluginConfig(implObject,config,pluginName,[key]));
	});

	it("Should return true if a key was requested that exists and was configured and matches expected return value",function(){
	    var implObject = {key: "value" },
	    config = {myPlugin: { key: "value" } },
	    key = "key",
	    value = "value";
	    assert.isTrue(BOOMR.utils.pluginConfig(implObject,config,pluginName,[key]));
	});
    });
});
