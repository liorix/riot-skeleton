/* */ 
var map = require("./map"),
    property = require("../utility/property");
function pluck(collection, key) {
  return map(collection, property(key));
}
module.exports = pluck;
