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
