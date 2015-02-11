/* */ 
var baseToString = require("./baseToString");
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      return +object == +other;
    case errorTag:
      return object.name == other.name && object.message == other.message;
    case numberTag:
      return (object != +object) ? other != +other : (object == 0 ? ((1 / object) == (1 / other)) : object == +other);
    case regexpTag:
    case stringTag:
      return object == baseToString(other);
  }
  return false;
}
module.exports = equalByTag;
