/* */ 
var find = require("./find"),
    matches = require("../utility/matches");
function findWhere(collection, source) {
  return find(collection, matches(source));
}
module.exports = findWhere;
