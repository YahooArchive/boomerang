/* eslint-env mocha */
/* global chai */

describe("BOOMR.utils.arrayFind()", function() {
  var assert = chai.assert;

  it("Should return undefined if input is not an array", function() {
    var findFunction = function() {
      return false;
    };

    assert.isUndefined(BOOMR.utils.arrayFind(null, findFunction));
  });

  it("Should return undefined if predicate is not a function", function() {
    var input = [1, 2, 3, 4];

    assert.isUndefined(BOOMR.utils.arrayFind(input, null));
  });

  it("Should return undefined if the predicate only returns false", function() {
    var input = [1, 2, 3, 4];

    var findFunction = function() {
      return false;
    };

    assert.isUndefined(BOOMR.utils.arrayFind(input, findFunction));
  });

  it("Should return value of match if only one matches", function() {
    var input = [1, 2, 3, 4],
        expect = 3;

    var findFunction = function(value) {
      return value === 3;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction), expect);
  });

  it("Should return value of first match if multiple matches", function() {
    var input = [1, 2, 3, 4],
        expect = 2;

    var findFunction = function(value, index, array) {
      return value >= 2;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction), expect);
  });

  it("Should return undefined if no matches", function() {
    var input = [1, 2, 3, 4];

    var findFunction = function(value) {
      return value === 0;
    };

    assert.isUndefined(BOOMR.utils.arrayFind(input, findFunction));
  });

  it("Should also work if find has been set to null or undefined (ie. lacking [].find support)", function() {
    var input = [1, 2, 3, 4],
        expect = 2;

    input.filter = undefined;

    var findFunction = function(value) {
      return value >= 2;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction), expect);
  });

  it("Should return undefined for a reverse search if input is not an array", function() {
    var findFunction = function() {
      return false;
    };

    assert.isUndefined(BOOMR.utils.arrayFind(null, findFunction, true));
  });

  it("Should return undefined for a reverse search if predicate is not a function", function() {
    var input = [1, 2, 3, 4];

    assert.isUndefined(BOOMR.utils.arrayFind(input, null, true));
  });

  it("Should return undefined for a reverse search if the predicate only returns false", function() {
    var input = [1, 2, 3, 4];

    var findFunction = function() {
      return false;
    };

    assert.isUndefined(BOOMR.utils.arrayFind(input, findFunction, true));
  });

  it("Should return value of match for a reverse search if only one matches", function() {
    var input = [1, 2, 3, 4],
        expect = 3;

    var findFunction = function(value) {
      return value === 3;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction, true), expect);
  });

  it("Should return value of last match for a reverse search if multiple matches", function() {
    var input = [1, 2, 3, 4],
        expect = 4;

    var findFunction = function(value) {
      return value >= 2;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction, true), expect);
  });

  it("Should return undefined for a reverse search if no matches", function() {
    var input = [1, 2, 3, 4];

    var findFunction = function(value) {
      return value === 0;
    };

    assert.isUndefined(BOOMR.utils.arrayFind(input, findFunction, true));
  });

  it("Should also work for a reverse search if findLast has been set to null or undefined (ie. lacking [].findLast support)", function() {
    var input = [1, 2, 3, 4],
        expect = 3;

    input.findLast = undefined;

    var findFunction = function(value) {
      return value <= 3;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction, true), expect);
  });

  it("Should pass the correct index and array arguments to the predicate on a reverse search", function() {
    var input = [1, 2, 3, 4],
        expectIndex = 2,
        expectValue = 3;

    var findFunction = function(value, index, array) {
      assert.equal(array, input);

      return index === expectIndex;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction, true), expectValue);
  });

  it("Should default to a forward search if reverse is falsy", function() {
    var input = [1, 2, 3, 4],
        expect = 2;

    var findFunction = function(value) {
      return value >= 2;
    };

    assert.equal(BOOMR.utils.arrayFind(input, findFunction, false), expect);
    assert.equal(BOOMR.utils.arrayFind(input, findFunction), expect);
  });
});
