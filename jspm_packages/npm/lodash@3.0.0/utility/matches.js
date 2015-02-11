/* */ 
var baseMatches = require("../internal/baseMatches");
function matches(source) {
  return baseMatches(source, true);
}
module.exports = matches;
