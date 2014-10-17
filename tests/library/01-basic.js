var assert = chai.assert;

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
	    assert.isObject(BOOMR.session);
	});

	it("Should have an existing BOOMR.init() Function",function() {
	    assert.isFunction(BOOMR.init);
	});

	it("Should have an existing BOOMR.debug(), BOOMR.warn() and info() Function",function() {
	    assert.isFunction(BOOMR.debug, "debug() exists");
	    assert.isFunction(BOOMR.warn, "warn() exists");
	    assert.isFunction(BOOMR.info,"info() exits");
	});

	it("Should have an existing BOOMR.plugins Object", function(){
	    assert.isObject(BOOMR.plugins);;
	});
    });
});
