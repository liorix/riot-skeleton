/* */ 
var LazyWrapper = require("./LazyWrapper");
function lazyReverse() {
  var filtered = this.filtered,
      result = filtered ? new LazyWrapper(this) : this.clone();
  result.dir = this.dir * -1;
  result.filtered = filtered;
  return result;
}
module.exports = lazyReverse;
