//
// Imports
//
var url = require("url");

//
// Exports
//
module.exports = function(req, res) {
  // set a few headers
  res.setHeader("Content-Length", 0);
  res.setHeader("Content-Type", url.parse(req.url).query);
  res.setHeader("Timing-Allow-Origin", "*");

  res.send();
};
