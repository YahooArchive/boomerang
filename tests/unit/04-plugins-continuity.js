/* eslint-env mocha */
/* global chai */

describe("BOOMR.plugins.Continuity", function() {
  var assert = chai.assert;

  beforeEach(function() {
    if (!BOOMR.plugins.Continuity) {
      return this.skip();
    }
  });

  describe("exports", function() {
    it("Should have a Continuity object", function() {
      assert.isObject(BOOMR.plugins.Continuity);
    });

    it("Should have a is_complete() function", function() {
      assert.isFunction(BOOMR.plugins.Continuity.is_complete);
    });
  });

  describe("compressBucketLog()", function() {
    describe("Mode 0 (small numbers)", function() {
      it("Should return an empty string when not given valid input ()", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(0, false), 0, 0);
      });

      it("Should return an empty string when given an empty object", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(0, false, {}, 0, 0));
      });

      it("Should return an empty string when given an empty array", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(0, false, [], 0, 0));
      });

      it("Should return an empty string for a single value 0", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0
        }, 0, 0));
      });

      it("Should return a single character for a single value 1", function() {
        assert.equal("01", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1
        }, 0, 0));
      });

      it("Should return a single character for a single value 10", function() {
        assert.equal("0a", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 10
        }, 0, 0));
      });

      it("Should return a single character for a single value 36", function() {
        assert.equal("0A", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 36
        }, 0, 0));
      });

      it("Should return a single character for a single value 62", function() {
        assert.equal("0-", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 62
        }, 0, 0));
      });

      it("Should return a single character for a single value 63", function() {
        assert.equal("0_", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 63
        }, 0, 0));
      });

      it("Should return a single character for a single value 64", function() {
        assert.equal("0.1s.", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 64
        }, 0, 0));
      });

      it("Should return a single character for a single value 100", function() {
        assert.equal("0.2s.", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 100
        }, 0, 0));
      });

      it("Should return multiple values > 63", function() {
        assert.equal("0.2s..5k..8c.", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 100,
          1: 200,
          2: 300
        }, 0, 2));
      });

      it("Should return a list for two consecutive values", function() {
        assert.equal("012", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1,
          1: 2
        }, 0, 1));
      });

      it("Should return a list for 10 consecutive values", function() {
        assert.equal("0123456789a", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1,
          1: 2,
          2: 3,
          3: 4,
          4: 5,
          5: 6,
          6: 7,
          7: 8,
          8: 9,
          9: 10
        }, 0, 9));
      });

      it("Should return a list with holes filled in for missing values", function() {
        assert.equal("01002", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1,
          3: 2
        }, 0, 3));
      });

      it("Should return a list with repeating numbers 1", function() {
        assert.equal("00*4*12", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 2
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 2", function() {
        assert.equal("00*5*1", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 3", function() {
        assert.equal("0*4*1*4*2", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 2,
          5: 2,
          6: 2,
          7: 2
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 4", function() {
        assert.equal("0*8*1", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 5", function() {
        assert.equal("0*8*a", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 10,
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 6", function() {
        assert.equal("0*8*.2s.", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 100,
          5: 100,
          6: 100,
          7: 100
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 7", function() {
        assert.equal("0*4*.2s.*4*1", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list when the first index is missing", function() {
        assert.equal("0012", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          1: 1,
          2: 2
        }, 0, 2));
      });

      it("Should return a list when the first 2 indicies are missing", function() {
        assert.equal("00023", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          2: 2,
          3: 3
        }, 0, 3));
      });

      it("Should return a list when the first 3 indicies are missing", function() {
        assert.equal("000034", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          3: 3,
          4: 4
        }, 0, 4));
      });

      it("Should return a list when the first 4 indicies are missing", function() {
        assert.equal("0*4*045", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          4: 4,
          5: 5
        }, 0, 5));
      });

      it("Should return a list when the last index is missing", function() {
        assert.equal("001", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0,
          1: 1
        }, 0, 2));
      });

      it("Should return a list when the last index is missing and it's a large number", function() {
        assert.equal("001", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0,
          1: 1
        }, 0, 100));
      });

      it("Should return a list when the last 2 indicies are missing", function() {
        assert.equal("0010", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0,
          1: 1
        }, 0, 3));
      });

      it("Should return a list when the last 3 indicies are missing", function() {
        assert.equal("00100", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0,
          1: 1
        }, 0, 4));
      });

      it("Should return a list when the last 4 indicies are missing", function() {
        assert.equal("001", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 0,
          1: 1
        }, 0, 5));
      });

      it("Should return a list when there are missing indicies in the middle", function() {
        assert.equal("01*9*01", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1,
          10: 1
        }, 0, 10));
      });

      it("Should return a list when there are missing indicies everywhere", function() {
        assert.equal("0*a*01*9*01", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          10: 1,
          20: 1
        }, 0, 30));
      });

      it("Should return a list when there are missing indicies at the end, and they should be left off", function() {
        assert.equal("011", BOOMR.plugins.Continuity.compressBucketLog(0, false, {
          0: 1,
          1: 1
        }, 0, 9999));
      });
    });

    describe("Mode 0 (small numbers) (backfill)", function() {
      it("Should return a single character for a single value 10", function() {
        assert.equal("0a", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 10
        }, 0, 0));
      });

      it("Should return a single character for a single value 36", function() {
        assert.equal("0A", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 36
        }, 0, 0));
      });

      it("Should return a single character for a single value 62", function() {
        assert.equal("0-", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 62
        }, 0, 0));
      });

      it("Should return a single character for a single value 63", function() {
        assert.equal("0_", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 63
        }, 0, 0));
      });

      it("Should return a single character for a single value 64", function() {
        assert.equal("0.1s.", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 64
        }, 0, 0));
      });

      it("Should return a single character for a single value 100", function() {
        assert.equal("0.2s.", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 100
        }, 0, 0));
      });

      it("Should return multiple values > 63", function() {
        assert.equal("0.2s..5k..8c.", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 100,
          1: 200,
          2: 300
        }, 0, 2));
      });

      it("Should return a list for two consecutive values", function() {
        assert.equal("012", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 1,
          1: 2
        }, 0, 1));
      });

      it("Should return a list for 10 consecutive values", function() {
        assert.equal("0123456789a", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 1,
          1: 2,
          2: 3,
          3: 4,
          4: 5,
          5: 6,
          6: 7,
          7: 8,
          8: 9,
          9: 10
        }, 0, 9));
      });

      it("Should return a list with backfill for missing values", function() {
        assert.equal("01112", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 1,
          3: 2
        }, 0, 3));
      });

      it("Should return a list with repeating numbers 1", function() {
        assert.equal("00*4*12", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 2
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 2", function() {
        assert.equal("00*5*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 3", function() {
        assert.equal("0*4*1*4*2", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 2,
          5: 2,
          6: 2,
          7: 2
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 4", function() {
        assert.equal("0*8*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 5", function() {
        assert.equal("0*8*a", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 10,
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 6", function() {
        assert.equal("0*8*.2s.", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 100,
          5: 100,
          6: 100,
          7: 100
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 7", function() {
        assert.equal("0*4*.2s.*4*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list when the first index is missing", function() {
        assert.equal("0012", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          1: 1,
          2: 2
        }, 0, 2));
      });

      it("Should return a list when the first 2 indicies are missing", function() {
        assert.equal("00023", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          2: 2,
          3: 3
        }, 0, 3));
      });

      it("Should return a list when the first 3 indicies are missing", function() {
        assert.equal("000034", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          3: 3,
          4: 4
        }, 0, 4));
      });

      it("Should return a list when the first 4 indicies are missing", function() {
        assert.equal("0*4*045", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          4: 4,
          5: 5
        }, 0, 5));
      });

      it("Should return a list when the last index is missing", function() {
        assert.equal("0011", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 0,
          1: 1
        }, 0, 2));
      });

      it("Should return a list when the last index is missing and it's a large number", function() {
        assert.equal("00*2s*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 0,
          1: 1
        }, 0, 100));
      });

      it("Should return a list when the last 2 indicies are missing", function() {
        assert.equal("00111", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 0,
          1: 1
        }, 0, 3));
      });

      it("Should return a list when the last 3 indicies are missing", function() {
        assert.equal("00*4*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 0,
          1: 1
        }, 0, 4));
      });

      it("Should return a list when the last 4 indicies are missing", function() {
        assert.equal("00*5*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 0,
          1: 1
        }, 0, 5));
      });

      it("Should return a list when there are missing indicies in the middle", function() {
        assert.equal("0*b*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 1,
          10: 1
        }, 0, 10));
      });

      it("Should return a list when there are missing indicies everywhere", function() {
        assert.equal("0*a*0*l*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          10: 1,
          20: 1
        }, 0, 30));
      });

      it("Should return a list when there are missing indicies at the end", function() {
        assert.equal("0*7ps*1", BOOMR.plugins.Continuity.compressBucketLog(0, true, {
          0: 1,
          1: 1
        }, 0, 9999));
      });
    });

    describe("Mode 1 (large numbers)", function() {
      it("Should return an empty string when not given valid input ()", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(1, false), 0, 0);
      });

      it("Should return an empty string when given an empty object", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(1, false, {}, 0, 0));
      });

      it("Should return an empty string when given an empty array", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(1, false, [], 0, 0));
      });

      it("Should return an empty string for a single value 0", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0
        }, 0, 0));
      });

      it("Should return a single character for a single value 1", function() {
        assert.equal("11", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1
        }, 0, 0));
      });

      it("Should return a single character for a single value 10", function() {
        assert.equal("1a", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 10
        }, 0, 0));
      });

      it("Should return a single character for a single value 36", function() {
        assert.equal("110", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 36
        }, 0, 0));
      });

      it("Should return a single character for a single value 62", function() {
        assert.equal("11q", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 62
        }, 0, 0));
      });

      it("Should return a single character for a single value 63", function() {
        assert.equal("11r", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 63
        }, 0, 0));
      });

      it("Should return a single character for a single value 64", function() {
        assert.equal("11s", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 64
        }, 0, 0));
      });

      it("Should return a single character for a single value 100", function() {
        assert.equal("12s", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 100
        }, 0, 0));
      });

      it("Should return multiple values > 63", function() {
        assert.equal("12s,5k,8c", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 100,
          1: 200,
          2: 300
        }, 0, 2));
      });

      it("Should return a list for two consecutive values", function() {
        assert.equal("11,2", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1,
          1: 2
        }, 0, 1));
      });

      it("Should return a list for 10 consecutive values", function() {
        assert.equal("11,2,3,4,5,6,7,8,9,a", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1,
          1: 2,
          2: 3,
          3: 4,
          4: 5,
          5: 6,
          6: 7,
          7: 8,
          8: 9,
          9: 10
        }, 0, 9));
      });

      it("Should return a list with holes filled in for missing values", function() {
        assert.equal("11,0,0,2", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1,
          3: 2
        }, 0, 3));
      });

      it("Should return a list with repeating numbers 1", function() {
        assert.equal("10,*4*1,2", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 2
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 2", function() {
        assert.equal("10,*5*1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 3", function() {
        assert.equal("1*4*1,*4*2", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 2,
          5: 2,
          6: 2,
          7: 2
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 4", function() {
        assert.equal("1*8*1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 5", function() {
        assert.equal("1*8*a", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 10,
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 6", function() {
        assert.equal("1*8*2s", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 100,
          5: 100,
          6: 100,
          7: 100
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 7", function() {
        assert.equal("1*4*2s,*4*1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list when the first index is missing", function() {
        assert.equal("10,1,2", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          1: 1,
          2: 2
        }, 0, 2));
      });

      it("Should return a list when the first 2 indicies are missing", function() {
        assert.equal("10,0,2,3", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          2: 2,
          3: 3
        }, 0, 3));
      });

      it("Should return a list when the first 3 indicies are missing", function() {
        assert.equal("10,0,0,3,4", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          3: 3,
          4: 4
        }, 0, 4));
      });

      it("Should return a list when the first 4 indicies are missing", function() {
        assert.equal("1*4*0,4,5", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          4: 4,
          5: 5
        }, 0, 5));
      });

      it("Should return a list when the last index is missing", function() {
        assert.equal("10,1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0,
          1: 1
        }, 0, 2));
      });

      it("Should return a list when the last index is missing and it's a large number", function() {
        assert.equal("10,1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0,
          1: 1
        }, 0, 100));
      });

      it("Should return a list when the last 2 indicies are missing", function() {
        assert.equal("10,1,0", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0,
          1: 1
        }, 0, 3));
      });

      it("Should return a list when the last 3 indicies are missing", function() {
        assert.equal("10,1,0,0", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0,
          1: 1
        }, 0, 4));
      });

      it("Should return a list when the last 4 indicies are missing", function() {
        assert.equal("10,1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 0,
          1: 1
        }, 0, 5));
      });

      it("Should return a list when there are missing indicies in the middle", function() {
        assert.equal("11,*9*0,1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1,
          10: 1
        }, 0, 10));
      });

      it("Should return a list when there are missing indicies everywhere", function() {
        assert.equal("1*a*0,1,*9*0,1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          10: 1,
          20: 1
        }, 0, 30));
      });

      it("Should return a list when there are missing indicies at the end, and they should be left off", function() {
        assert.equal("11,1", BOOMR.plugins.Continuity.compressBucketLog(1, false, {
          0: 1,
          1: 1
        }, 0, 9999));
      });
    });

    describe("Mode 2 (percentage)", function() {
      it("Should return an empty string when not given valid input ()", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(2, false), 0, 0);
      });

      it("Should return an empty string when given an empty object", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(2, false, {}, 0, 0));
      });

      it("Should return an empty string when given an empty array", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(2, false, [], 0, 0));
      });

      it("Should return an empty string for a single value 0", function() {
        assert.equal("", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0
        }, 0, 0));
      });

      it("Should return a single number for a single value 1", function() {
        assert.equal("201", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1
        }, 0, 0));
      });

      it("Should return a single number for a single value 10", function() {
        assert.equal("210", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 10
        }, 0, 0));
      });

      it("Should return a single number for a single value 36", function() {
        assert.equal("236", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 36
        }, 0, 0));
      });

      it("Should return a single number for a single value 62", function() {
        assert.equal("262", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 62
        }, 0, 0));
      });

      it("Should return a single number for a single value 63", function() {
        assert.equal("263", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 63
        }, 0, 0));
      });

      it("Should return a single number for a single value 64", function() {
        assert.equal("264", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 64
        }, 0, 0));
      });

      it("Should return a single number for a single value 100", function() {
        assert.equal("2__", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 100
        }, 0, 0));
      });

      it("Should return a single number for a single value 101", function() {
        assert.equal("2__", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 101
        }, 0, 0));
      });

      it("Should return a single number for a single value 9999999", function() {
        assert.equal("2__", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 9999999
        }, 0, 0));
      });

      it("Should return a single number for a single value -1", function() {
        assert.equal("200", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: -1
        }, 0, 0));
      });

      it("Should return multiple values > 63", function() {
        assert.equal("2______", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 100,
          1: 200,
          2: 300
        }, 0, 2));
      });

      it("Should return a list for two consecutive values", function() {
        assert.equal("20102", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1,
          1: 2
        }, 0, 1));
      });

      it("Should return a list for 10 consecutive values", function() {
        assert.equal("201020304050607080910", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1,
          1: 2,
          2: 3,
          3: 4,
          4: 5,
          5: 6,
          6: 7,
          7: 8,
          8: 9,
          9: 10
        }, 0, 9));
      });

      it("Should return a list with holes filled in for missing values", function() {
        assert.equal("201000002", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1,
          3: 2
        }, 0, 3));
      });

      it("Should return a list with repeating numbers 1", function() {
        assert.equal("200*4*0102", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 2
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 2", function() {
        assert.equal("200*5*01", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1
        }, 0, 5));
      });

      it("Should return a list with repeating numbers 3", function() {
        assert.equal("2*4*01*4*02", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 2,
          5: 2,
          6: 2,
          7: 2
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 4", function() {
        assert.equal("2*8*01", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1,
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 5", function() {
        assert.equal("2*8*10", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 10,
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 6", function() {
        assert.equal("2*8*__", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 100,
          5: 100,
          6: 100,
          7: 100
        }, 0, 7));
      });

      it("Should return a list with repeating numbers 7", function() {
        assert.equal("2*4*__*4*01", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 100,
          1: 100,
          2: 100,
          3: 100,
          4: 1,
          5: 1,
          6: 1,
          7: 1
        }, 0, 7));
      });

      it("Should return a list when the first index is missing", function() {
        assert.equal("2000102", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          1: 1,
          2: 2
        }, 0, 2));
      });

      it("Should return a list when the first 2 indicies are missing", function() {
        assert.equal("200000203", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          2: 2,
          3: 3
        }, 0, 3));
      });

      it("Should return a list when the first 3 indicies are missing", function() {
        assert.equal("20000000304", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          3: 3,
          4: 4
        }, 0, 4));
      });

      it("Should return a list when the first 4 indicies are missing", function() {
        assert.equal("2*4*000405", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          4: 4,
          5: 5
        }, 0, 5));
      });

      it("Should return a list when the last index is missing", function() {
        assert.equal("20001", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0,
          1: 1
        }, 0, 2));
      });

      it("Should return a list when the last index is missing and it's a large number", function() {
        assert.equal("20001", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0,
          1: 1
        }, 0, 100));
      });

      it("Should return a list when the last 2 indicies are missing", function() {
        assert.equal("2000100", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0,
          1: 1
        }, 0, 3));
      });

      it("Should return a list when the last 3 indicies are missing", function() {
        assert.equal("200010000", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0,
          1: 1
        }, 0, 4));
      });

      it("Should return a list when the last 4 indicies are missing", function() {
        assert.equal("20001", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 0,
          1: 1
        }, 0, 5));
      });

      it("Should return a list when there are missing indicies in the middle", function() {
        assert.equal("201*9*0001", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1,
          10: 1
        }, 0, 10));
      });

      it("Should return a list when there are missing indicies everywhere", function() {
        assert.equal("2*a*0001*9*0001", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          10: 1,
          20: 1
        }, 0, 30));
      });

      it("Should return a list when there are missing indicies at the end, and they should be left off", function() {
        assert.equal("20101", BOOMR.plugins.Continuity.compressBucketLog(2, false, {
          0: 1,
          1: 1
        }, 0, 9999));
      });
    });
  });

  describe("decompressBucketLogNumber()", function() {
    it("Should return 0 if given a bad input", function() {
      assert.equal(0, BOOMR.plugins.Continuity.decompressBucketLogNumber());
      assert.equal(0, BOOMR.plugins.Continuity.decompressBucketLogNumber(""));
      assert.equal(0, BOOMR.plugins.Continuity.decompressBucketLogNumber({}));
      assert.equal(0, BOOMR.plugins.Continuity.decompressBucketLogNumber([]));
      assert.equal(0, BOOMR.plugins.Continuity.decompressBucketLogNumber());
    });

    it("Should return 0 - 9 if given '0' through '9'", function() {
      assert.equal(0, BOOMR.plugins.Continuity.decompressBucketLogNumber("0"));
      assert.equal(1, BOOMR.plugins.Continuity.decompressBucketLogNumber("1"));
      assert.equal(2, BOOMR.plugins.Continuity.decompressBucketLogNumber("2"));
      assert.equal(3, BOOMR.plugins.Continuity.decompressBucketLogNumber("3"));
      assert.equal(4, BOOMR.plugins.Continuity.decompressBucketLogNumber("4"));
      assert.equal(5, BOOMR.plugins.Continuity.decompressBucketLogNumber("5"));
      assert.equal(6, BOOMR.plugins.Continuity.decompressBucketLogNumber("6"));
      assert.equal(7, BOOMR.plugins.Continuity.decompressBucketLogNumber("7"));
      assert.equal(8, BOOMR.plugins.Continuity.decompressBucketLogNumber("8"));
      assert.equal(9, BOOMR.plugins.Continuity.decompressBucketLogNumber("9"));
    });

    it("Should return 10 - 36 if given 'a' through 'z'", function() {
      assert.equal(10, BOOMR.plugins.Continuity.decompressBucketLogNumber("a"));
      assert.equal(11, BOOMR.plugins.Continuity.decompressBucketLogNumber("b"));
      assert.equal(35, BOOMR.plugins.Continuity.decompressBucketLogNumber("z"));
    });

    it("Should return 37 - 61 if given 'A' through 'Z'", function() {
      assert.equal(36, BOOMR.plugins.Continuity.decompressBucketLogNumber("A"));
      assert.equal(37, BOOMR.plugins.Continuity.decompressBucketLogNumber("B"));
      assert.equal(61, BOOMR.plugins.Continuity.decompressBucketLogNumber("Z"));
    });

    it("Should return 62 if given '_'", function() {
      assert.equal(62, BOOMR.plugins.Continuity.decompressBucketLogNumber("_"));
    });

    it("Should return 63 if given '-'", function() {
      assert.equal(63, BOOMR.plugins.Continuity.decompressBucketLogNumber("-"));
    });
  });

  describe("decompressLog()", function() {
    it("Should return a single event", function() {
      assert.deepEqual([{
        type: 1,
        time: 2,
        x: "3",
        y: "4"
      }], BOOMR.plugins.Continuity.decompressLog("12,x3,y4"));
    });

    it("Should return multiple events", function() {
      assert.deepEqual([{
        type: 1,
        time: 2
      }, {
        type: 3,
        time: 10
      }], BOOMR.plugins.Continuity.decompressLog("12|3a"));
    });
  });

  describe("decompressBucketLog()", function() {
    describe("Mode 0 (small numbers)", function() {
      it("Should return a single bucket", function() {
        var out = [1];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("01", 0));
      });

      it("Should return two buckets", function() {
        var out = [1, 2];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("012", 0));
      });

      it("Should return 3 buckets", function() {
        var out = [1, 2, 3];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("0123", 0));
      });

      it("Should return buckets with repeating zeros", function() {
        var out = [1, 2, 0, 0, 0, 0, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("012*4*09", 0));
      });

      it("Should return buckets with repeating small number", function() {
        var out = [1, 2, 8, 8, 8, 8, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("012*4*89", 0));
      });

      it("Should return buckets with repeating large number", function() {
        var out = [1, 2, 370, 370, 370, 370, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("012*4*.aa.9", 0));
      });

      it("Should return buckets with a large number", function() {
        var out = [370];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("0.aa.", 0));
      });

      it("Should return buckets with two large numbers", function() {
        var out = [370, 10];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("0.aa..a.", 0));
      });

      it("Should return buckets with a large repeat of a large number", function() {
        var out = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("0*a*.a.", 0));
      });

      it("Should return buckets with a large repeat of a large number and a following number", function() {
        var out = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("0*a*.a.1", 0));
      });

      it("Should return buckets with two repeats", function() {
        var out = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("0*5*1*5*2", 0));
      });

      it("Should return a complex bucket", function() {
        var out = [5, 3, 3, 5, 5, 5, 5, 10, 0, 0];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("0*1*5*2*3*4*5*1*.a.*2*0", 0));
      });
    });

    describe("Mode 1 (large numbers)", function() {
      it("Should return a single bucket", function() {
        var out = [1];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("11", 0));
      });

      it("Should return two buckets", function() {
        var out = [1, 2];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("11,2", 0));
      });

      it("Should return 3 buckets", function() {
        var out = [1, 2, 3];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("11,2,3", 0));
      });

      it("Should return buckets with repeating zeros", function() {
        var out = [1, 2, 0, 0, 0, 0, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("11,2,*4*0,9", 0));
      });

      it("Should return buckets with repeating small number", function() {
        var out = [1, 2, 8, 8, 8, 8, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("11,2,*4*8,9", 0));
      });

      it("Should return buckets with repeating large number", function() {
        var out = [1, 2, 370, 370, 370, 370, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("11,2,*4*aa,9", 0));
      });

      it("Should return buckets with a large number", function() {
        var out = [370];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("1aa", 0));
      });

      it("Should return buckets with two large numbers", function() {
        var out = [370, 10];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("1aa,a", 0));
      });

      it("Should return buckets with a large repeat of a large number", function() {
        var out = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("1*a*a", 0));
      });

      it("Should return buckets with a large repeat of a large number and a following number", function() {
        var out = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("1*a*a,1", 0));
      });

      it("Should return buckets with two repeats", function() {
        var out = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("1*5*1,*5*2", 0));
      });

      it("Should return a complex bucket", function() {
        var out = [5, 3, 3, 5, 5, 5, 5, 10, 0, 0];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("1*1*5,*2*3,*4*5,*1*a,*2*0", 0));
      });
    });

    describe("Mode 2 (percentage)", function() {
      it("Should return a single bucket", function() {
        var out = [1];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("201", 0));
      });

      it("Should return two buckets", function() {
        var out = [1, 2];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("20102", 0));
      });

      it("Should return 3 buckets", function() {
        var out = [1, 2, 3];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("2010203", 0));
      });

      it("Should return buckets with repeating zeros", function() {
        var out = [1, 2, 0, 0, 0, 0, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("20102*4*0009", 0));
      });

      it("Should return buckets with repeating small number", function() {
        var out = [1, 2, 8, 8, 8, 8, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("20102*4*0809", 0));
      });

      it("Should return buckets with repeating large number", function() {
        var out = [1, 2, 100, 100, 100, 100, 9];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("20102*4*__09", 0));
      });

      it("Should return buckets with a large number", function() {
        var out = [100];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("2__", 0));
      });

      it("Should return buckets with two large numbers", function() {
        var out = [100, 10];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("2__10", 0));
      });

      it("Should return buckets with a large repeat of a large number", function() {
        var out = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("2*a*10", 0));
      });

      it("Should return buckets with a large repeat of a large number and a following number", function() {
        var out = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("2*a*1001", 0));
      });

      it("Should return buckets with two repeats", function() {
        var out = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("2*5*01*5*02", 0));
      });

      it("Should return a complex bucket", function() {
        var out = [5, 3, 3, 5, 5, 5, 5, 10, 0, 0];

        assert.deepEqual(out, BOOMR.plugins.Continuity.decompressBucketLog("2*1*05*2*03*4*05*1*10*2*00", 0));
      });
    });
  });

  describe("determineTti()", function() {
    //
    // Minimal / Small bucket calculations with no data
    //
    describe("Calculations without data {}", function() {
      it("Should return no TTI if there are no buckets to analyze", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 0, lastBucketVisited: 0 },
          BOOMR.plugins.Continuity.determineTti(100, 200, 0, -1, 0, {}));
      });

      it("Should return no TTI if there was only a single bucket to analyze", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 1, lastBucketVisited: 0 },
          BOOMR.plugins.Continuity.determineTti(100, 200, 0, 0, 0, {}));
      });

      it("Should return no TTI if there were only 4 buckets to analyze", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 4, lastBucketVisited: 3 },
          BOOMR.plugins.Continuity.determineTti(100, 200, 0, 3, 0, {}));
      });

      it("Should return a TTI at start if there were 5 idle buckets", function() {
        assert.deepEqual(
          { tti: 100, idleIntervals: 5, lastBucketVisited: 4 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 4, 0, {}));
      });

      it("Should return a TTI at TTVR if there were 5 idle buckets and TTVR was higher than the start", function() {
        assert.deepEqual(
          { tti: 200, idleIntervals: 5, lastBucketVisited: 4 },
          BOOMR.plugins.Continuity.determineTti(100, 200, 0, 4, 0, {}));
      });
    });

    //
    // With Long Tasks
    //
    describe("Calculations with LongTask data", function() {
      it("Should return a TTI at start time if there is no LongTasks", function() {
        assert.deepEqual(
          { tti: 100, idleIntervals: 5, lastBucketVisited: 4 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            longtask: [0, 0, 0, 0, 0, 0]
          }));
      });

      it("Should return a TTI 100ms after start time if the first bucket is busy", function() {
        assert.deepEqual(
          { tti: 200, idleIntervals: 5, lastBucketVisited: 5 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            longtask: [1]
          }));
      });

      it("Should return a TTI 200ms after start time if the second bucket is busy", function() {
        assert.deepEqual(
          { tti: 300, idleIntervals: 5, lastBucketVisited: 6 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            longtask: [0, 1]
          }));
      });

      it("Should return a TTI 500ms after start time if the fifth bucket is busy", function() {
        assert.deepEqual(
          { tti: 600, idleIntervals: 5, lastBucketVisited: 9 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            longtask: [0, 0, 0, 0, 1]
          }));
      });

      it("Should return a TTI 1000ms after start time if the fifth and tenth buckets were busy", function() {
        assert.deepEqual(
          { tti: 1100, idleIntervals: 5, lastBucketVisited: 14 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
            longtask: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
          }));
      });
    });

    //
    // With FPS
    //
    describe("Calculations with FPS data", function() {
      it("Should return a TTI at start time if FPS was at 60 for the entire interval", function() {
        assert.deepEqual(
          { tti: 100, idleIntervals: 5, lastBucketVisited: 4 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            fps: [6, 6, 6, 6, 6, 6]
          }));
      });

      //
      // 0 FPS
      //
      it("Should return a TTI 100ms after start time if the first bucket had 0 FPS", function() {
        assert.deepEqual(
          { tti: 200, idleIntervals: 5, lastBucketVisited: 5 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            fps: [0, 6, 6, 6, 6, 6]
          }));
      });

      it("Should return a TTI 200ms after start time if the second bucket had 0 FPS", function() {
        assert.deepEqual(
          { tti: 300, idleIntervals: 5, lastBucketVisited: 6 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            fps: [6, 0, 6, 6, 6, 6, 6]
          }));
      });

      it("Should return a TTI 500ms after start time if the fifth bucket had 0 FPS", function() {
        assert.deepEqual(
          { tti: 600, idleIntervals: 5, lastBucketVisited: 9 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            fps: [6, 6, 6, 6, 0, 6, 6, 6, 6, 6]
          }));
      });

      it("Should return a TTI 1000ms after start time if the fifth and tenth buckets had 0 FPS", function() {
        assert.deepEqual(
          { tti: 1100, idleIntervals: 5, lastBucketVisited: 14 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
            fps: [6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6]
          }));
      });

      //
      // 2 FPS min
      //
      it("Should return a TTI 100ms after start time if the first bucket had 10 FPS and the rest were 20 FPS", function() {
        assert.deepEqual(
          { tti: 200, idleIntervals: 5, lastBucketVisited: 5 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            fps: [1, 2, 2, 2, 2, 2]
          }));
      });

      it("Should return a TTI 200ms after start time if the second bucket had 10 FPS and the rest were 20 FPS", function() {
        assert.deepEqual(
          { tti: 300, idleIntervals: 5, lastBucketVisited: 6 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            fps: [2, 1, 2, 2, 2, 2, 2]
          }));
      });

      it("Should return a TTI 500ms after start time if the fifth bucket had 10 FPS and the rest were 20 FPS", function() {
        assert.deepEqual(
          { tti: 600, idleIntervals: 5, lastBucketVisited: 9 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            fps: [2, 2, 2, 2, 1, 2, 2, 2, 2, 2]
          }));
      });

      it("Should return a TTI 1000ms after start time if the fifth and tenth buckets had 10 FPS and the rest were 20 FPS", function() {
        assert.deepEqual(
          { tti: 1100, idleIntervals: 5, lastBucketVisited: 14 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
            fps: [2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2]
          }));
      });
    });

    //
    // With Busy Data
    //
    describe("Calculations with Page Busy data", function() {
      it("Should return a TTI at start time if there is no Page Busy", function() {
        assert.deepEqual(
          { tti: 100, idleIntervals: 5, lastBucketVisited: 4 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            busy: [0, 0, 0, 0, 0, 0]
          }));
      });

      it("Should return a TTI of 0 if the first bucket is busy and there aren't any following buckets filled in yet", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 0, lastBucketVisited: 0 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            busy: [51]
          }));
      });

      it("Should return a TTI 100ms after start time if the first bucket is busy", function() {
        assert.deepEqual(
          { tti: 200, idleIntervals: 5, lastBucketVisited: 5 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            busy: [51, 0, 0, 0, 0, 0]
          }));
      });

      it("Should return a TTI of 0 if the first bucket is busy and there aren't any following buckets filled in yet", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 0, lastBucketVisited: 1 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            busy: [0, 51]
          }));
      });

      it("Should return a TTI 200ms after start time if the second bucket is busy", function() {
        assert.deepEqual(
          { tti: 300, idleIntervals: 5, lastBucketVisited: 6 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            busy: [0, 51, 0, 0, 0, 0, 0]
          }));
      });

      it("Should return a TTI of 0 if the fifth bucket is busy and there aren't any following buckets filled in yet", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 0, lastBucketVisited: 4 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            busy: [0, 0, 0, 0, 51]
          }));
      });

      it("Should return a TTI 500ms after start time if the fifth bucket is busy", function() {
        assert.deepEqual(
          { tti: 600, idleIntervals: 5, lastBucketVisited: 9 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            busy: [0, 0, 0, 0, 51, 0, 0, 0, 0, 0]
          }));
      });

      it("Should return a TTI 0 if the fifth bucket and tenth buckets are busy and there aren't any following buckets filled in yet", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 0, lastBucketVisited: 9 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
            busy: [0, 0, 0, 0, 51, 0, 0, 0, 0, 51]
          }));
      });

      it("Should return a TTI 1000ms after start time if the fifth and tenth buckets were busy", function() {
        assert.deepEqual(
          { tti: 1100, idleIntervals: 5, lastBucketVisited: 14 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
            busy: [0, 0, 0, 0, 51, 0, 0, 0, 0, 51, 0, 0, 0, 0, 0]
          }));
      });

      it("Should return no TTI if the Page Busy data hasn't been filled in for the period yet", function() {
        assert.deepEqual(
          { tti: 0, idleIntervals: 4, lastBucketVisited: 3 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
            busy: [0, 0, 0, 0]
          }));
      });

      it("Should have a TTI of 100ms if Page Busy data is later filled in", function() {
        var results = BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
          busy: [0, 0, 0, 0]
        });

        assert.deepEqual(
          { tti: 0, idleIntervals: 4, lastBucketVisited: 3 },
          results);

        results = BOOMR.plugins.Continuity.determineTti(100, 100, results.lastBucketVisited + 1, 20, results.idleIntervals, {
          busy: [0, 0, 0, 0, 0]
        });

        assert.deepEqual(
          { tti: 100, idleIntervals: 5, lastBucketVisited: 4 },
          results);
      });
    });

    //
    // With Delayed Interactions
    //
    describe("Calculations with Delayed Interaction data", function() {
      it("Should return a TTI at start time if there is no delayed interaction", function() {
        assert.deepEqual(
          { tti: 100, idleIntervals: 5, lastBucketVisited: 4 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            interdly: [0, 0, 0, 0, 0, 0]
          }));
      });

      it("Should return a TTI 100ms after start time if the first bucket had a delayed interaction", function() {
        assert.deepEqual(
          { tti: 200, idleIntervals: 5, lastBucketVisited: 5 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            interdly: [1]
          }));
      });

      it("Should return a TTI 200ms after start time if the second bucket had a delayed interaction", function() {
        assert.deepEqual(
          { tti: 300, idleIntervals: 5, lastBucketVisited: 6 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            interdly: [0, 1]
          }));
      });

      it("Should return a TTI 500ms after start time if the fifth bucket had a delayed interaction", function() {
        assert.deepEqual(
          { tti: 600, idleIntervals: 5, lastBucketVisited: 9 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 10, 0, {
            interdly: [0, 0, 0, 0, 1]
          }));
      });

      it("Should return a TTI 1000ms after start time if the fifth and tenth buckets had delayed interactions", function() {
        assert.deepEqual(
          { tti: 1100, idleIntervals: 5, lastBucketVisited: 14 },
          BOOMR.plugins.Continuity.determineTti(100, 100, 0, 20, 0, {
            interdly: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
          }));
      });
    });

    //
    // With previous Idle Intervals
    //
    describe("Calculations with previous Idle Intervals calculated", function() {
      it("Should utilize startBucket and idleIntervals from a previous calculation where idle is at bucket 0", function() {
        // call it once with two idle buckets
        var results = BOOMR.plugins.Continuity.determineTti(100, 100, 0, 1, 0, {
          longtask: [0, 0]
        });

        assert.deepEqual(
          { tti: 0, idleIntervals: 2, lastBucketVisited: 1 },
          results);

        // call again with 2 more idle buckets
        results = BOOMR.plugins.Continuity.determineTti(100, 100, results.lastBucketVisited + 1, 3, results.idleIntervals, {
          longtask: [0, 0, 0, 0]
        });

        assert.deepEqual(
          { tti: 0, idleIntervals: 4, lastBucketVisited: 3 },
          results);

        // call again with 6 more idle buckets
        results = BOOMR.plugins.Continuity.determineTti(100, 100, results.lastBucketVisited + 1, 9, results.idleIntervals, {
          longtask: [0, 0, 0, 0, 0, 0]
        });

        assert.deepEqual(
          { tti: 100, idleIntervals: 5, lastBucketVisited: 4 },
          results);
      });

      it("Should utilize startBucket and idleIntervals from a previous calculation where idle is at bucket 4", function() {
        // call it once with two idle buckets
        var results = BOOMR.plugins.Continuity.determineTti(100, 100, 0, 1, 0, {
          longtask: [0, 0]
        });

        assert.deepEqual(
          { tti: 0, idleIntervals: 2, lastBucketVisited: 1 },
          results);

        // call again with 2 more idle buckets
        results = BOOMR.plugins.Continuity.determineTti(100, 100, results.lastBucketVisited + 1, 3, results.idleIntervals, {
          longtask: [0, 0, 0, 0]
        });

        assert.deepEqual(
          { tti: 0, idleIntervals: 4, lastBucketVisited: 3 },
          results);

        // call again with 6 more buckets, with busyness at 5
        results = BOOMR.plugins.Continuity.determineTti(100, 100, results.lastBucketVisited + 1, 9, results.idleIntervals, {
          longtask: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
        });

        assert.deepEqual(
          { tti: 600, idleIntervals: 5, lastBucketVisited: 9 },
          results);
      });
    });
  });

  describe("compressClsScore and decompressClsScore", function() {
    it("Properly compressed and decompressed topScore of 0.050", function() {
      var topScore = 0.050;

      var newTopScore = BOOMR.plugins.Continuity.compressClsScore(topScore);

      newTopScore = BOOMR.plugins.Continuity.decompressClsScore(newTopScore);

      assert.equal(topScore, newTopScore);
    });

    it("Properly compressed and decompressed topScore of 0.153", function() {
      var topScore = 0.153;

      var newTopScore = BOOMR.plugins.Continuity.compressClsScore(topScore);

      newTopScore = BOOMR.plugins.Continuity.decompressClsScore(newTopScore);

      assert.equal(topScore, newTopScore);
    });
  });

  describe("compressClsSources and decompressClsSources", function() {
    it("Properly compressed and decompressed clsSources array", function() {
      var clsSources = [{
        value: 0.010,
        startTime: 2068,
        sources: [{
          selector: "img",
          previousRect: {x: 1608, y: 202, width: 800, height: 297},
          currentRect: {x: 1608, y: 499, width: 800, height: 297}
        }]
      },
      {
        value: 0.153,
        startTime: 3067,
        sources: [
          {
            selector: "img",
            previousRect: {x: 0, y: 120, width: 200, height: 74},
            currentRect: {x: 0, y: 1010, width: 200, height: 75}
          },
          {
            selector: "img",
            previousRect: {x: 0, y: 202, width: 1600, height: 594},
            currentRect: {x: 0, y: 1093, width: 1600, height: 549}
          },
          {
            selector: "img",
            previousRect: {x: 1608, y: 499, width: 800, height: 297},
            currentRect: {x: 1608, y: 1389, width: 800, height: 253}
          }
        ]
      }];

      var newClsSources = BOOMR.plugins.Continuity.compressClsSources(clsSources);

      newClsSources = BOOMR.plugins.Continuity.decompressClsSources(newClsSources);

      assert.deepEqual(clsSources, newClsSources);
    });
  });
});
