/* */ 
var filter = require("./filter"),
    matches = require("../utility/matches");
function where(collection, source) {
  return filter(collection, matches(source));
}
module.exports = where;
