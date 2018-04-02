1. Add random sampling
   This needs to be a little intelligent because plugins may have different
   criteria for sampling.  For example, the RT plugin requires two pages --
   one for tstart and one for tend.  Since tstart is a relatively inexpensive
   operation, it makes sense for us to set tstart on all pages, but only set
   tend based on the random sample.

2. Rewrite bandwidth testing code to be pretty and clean
