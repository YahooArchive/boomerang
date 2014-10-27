describe ("Basic Checks",function() {
    describe("Object existence",function() {
	it("Should have an existing BOOMR object",function() {
	    assert.isObject(BOOMR);
	});

	it("Should have an existing BOOMR.utils object",function() {
	    assert.isObject(BOOMR.utils);
	});

	it("Should have an existing BOOMR.version String",function() {
	    assert.isString(BOOMR.version);
	});

	it("Should have an existing BOOMR.session Object",function() {
	    console.log("Not sure if this is still relevant please report feedback in issue #40 on lognormal/boomerang");
	    assert.isObject(BOOMR.session);
	});

	it("Should have an existing BOOMR.init() Function",function() {
	    assert.isFunction(BOOMR.init);
	});

	it("Should have an existing BOOMR.plugins Object", function(){
	    assert.isObject(BOOMR.plugins);;
	});
    });
});
