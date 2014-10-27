describe ("Cookie Tests",function() {
    var cookieName = "myCookie";

    /* 
       NOTE:

       These tests can only run in a client-server setup with a properly 
       configured FQDN for the server.
       
       Please read: 
         RFC 2109 (https://www.ietf.org/rfc/rfc2109.txt)
       and this thread on the chromium bugtracker:
         https://code.google.com/p/chromium/issues/detail?id=535

       In your development environment please configure your localhost with a fully 
       qualified domain name locally:
       
       In a UNIX/Mac/Linux environment you can add a name for 127.0.0.1 to
       your /etc/hosts such as: 
         127.0.0.1	www.example.org  www

       You can do the same under windows, however the path to the file is a 
       little different: 
       
       Valid for Windown Vista/7/2008/2012: C:\Windows\System32\drivers\etc\hosts
       
       We (as in the boomerang team) are not responsible for any accidental or 
       direct damages and or damage claims. See LICENSE for further information.
    */
    
    if (window.location.protocol === "file:")
	return;

    describe("getCookie Tests",function() {
	it("Should have an exisiting BOOMR.utils.getCookie function",function() {
	    assert.isFunction(BOOMR.utils.getCookie);
	});

	it("Should return null when calling getCookie() with empty arguments",function() {
	    assert.isNull(BOOMR.utils.getCookie());
	});

	it("Should return null when calling getCookie with empty String",function(){
	    assert.isNull(BOOMR.utils.getCookie(""));
	});
	it("Should return null when calling with null as first argument",function(){
	    assert.isNull(BOOMR.utils.getCookie(null));
	});

	it("Should return null when calling with not existing cookie",function() {
	    assert.isNull(BOOMR.utils.getCookie("some-none-existing-cooke"));
	});
    });

    describe("setCookie Tests",function() {
	it("Should have an exisiting BOOMR.utils.setCookie function",function(){
	    assert.isFunction(BOOMR.utils.setCookie);
	});

	it("Should return false if no name was passed as first argument to setCookie()",function()  {
	    assert.isFalse(BOOMR.utils.setCookie());
	});

	it("Should return false when setting only Cookie name",function() {
	    assert.isFalse(BOOMR.utils.setCookie(cookieName));
	});

	it("Should return true when setting Cookie with value",function(){
	    assert.isTrue(BOOMR.utils.setCookie(cookieName,"value"));
	});
	
	it("Should return false when removing previously set Cookie",function(){
	    assert.isTrue(BOOMR.utils.removeCookie(cookieName));
	});
	
	it("Should return the cookie value string that we've set previously", function() {
	    var value = "value";
	    BOOMR.utils.setCookie(cookieName,value);

	    assert.equal(BOOMR.utils.getCookie(cookieName),value);
	    BOOMR.utils.removeCookie(cookieName);
	});
	
	it("Should return the EXACT value string that we've set previously",function () {
	    var value = "1";
	    var value_strict_false = 1;

	    BOOMR.utils.setCookie(cookieName,value);
	    assert.strictEqual(BOOMR.utils.getCookie(cookieName),value);
	    assert.notStrictEqual(BOOMR.utils.getCookie(cookieName),value_strict_false);
	    BOOMR.utils.removeCookie(cookieName);
	});

	it("Should return false when trying to set a cookie bigger than 500 characters",function() {
	    var value = "";
	    for (var index = 0; index <= 500;index++) {
		value += "1";
	    }
	    assert.isFalse(BOOMR.utils.setCookie("failCookie",value));

	});
    });

    describe("getSubCookies",function() {

	it("Should have an exisiting BOOMR.utils.getSubCookies function",function() {
	    assert.isFunction(BOOMR.utils.getSubCookies);
	});

	it("Should return null when calling getSubCookies() with empty arguments",function() {
	    assert.isNull(BOOMR.utils.getSubCookies());
	});

	it("Should return null when calling getSubCookies with empty String",function(){
	    assert.isNull(BOOMR.utils.getSubCookies(""));
	});
	it("Should return null when calling with null as first argument",function(){
	    assert.isNull(BOOMR.utils.getSubCookies(null));
	});
	
	it("Should return null when calling with a non-string object",function() {
	    assert.isNull(BOOMR.utils.getSubCookies({key: "value"}));
	});
	
	it("Should return the value that we've set previously",function () {
	    var value = {value : { subValue: "value" }};
	    BOOMR.utils.setCookie(cookieName,value);
	    assert.deepEqual(BOOMR.utils.getSubCookies("subValue"),{subValue: "value"});
	});

	it("Should return null when requesting the subCookie '&'",function() {
	    assert.isNull(BOOMR.utils.getSubCookies("&"));			
	});

	it("Should return null when requesting the subCookie '=&='",function(){
	    assert.isNull(BOOMR.utils.getSubCookies("=&="));
	});

	it("Should return null when requesting a value instead of a key for a subCookie i.e. '=someValue'",function(){
	    assert.isNull(BOOMR.utils.getSubCookies("=someValue"));
	});

	it("Should return null when requesting a subCookie named '='",function() {
	    assert.isNull(BOOMR.utils.getSubCookies("="));
	});
    });
});
