/* */ 
var LazyWrapper = require("../internal/LazyWrapper"),
    LodashWrapper = require("../internal/LodashWrapper"),
    thru = require("./thru");
function wrapperReverse() {
  var value = this.__wrapped__;
  if (value instanceof LazyWrapper) {
    return new LodashWrapper(value.reverse());
  }
  return this.thru(function(value) {
    return value.reverse();
  });
}
module.exports = wrapperReverse;
