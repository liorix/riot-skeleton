/* */ 
var baseMatches = require("./baseMatches"),
    baseProperty = require("./baseProperty"),
    baseToString = require("./baseToString"),
    bindCallback = require("./bindCallback"),
    identity = require("../utility/identity"),
    isBindable = require("./isBindable");
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return (typeof thisArg != 'undefined' && isBindable(func)) ? bindCallback(func, thisArg, argCount) : func;
  }
  if (func == null) {
    return identity;
  }
  return type == 'object' ? baseMatches(func, !argCount) : baseProperty(argCount ? baseToString(func) : func);
}
module.exports = baseCallback;
