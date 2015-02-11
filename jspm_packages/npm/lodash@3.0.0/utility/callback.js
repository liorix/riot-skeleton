/* */ 
var baseCallback = require("../internal/baseCallback"),
    isIterateeCall = require("../internal/isIterateeCall");
function callback(func, thisArg, guard) {
  if (guard && isIterateeCall(func, thisArg, guard)) {
    thisArg = null;
  }
  return baseCallback(func, thisArg);
}
module.exports = callback;
