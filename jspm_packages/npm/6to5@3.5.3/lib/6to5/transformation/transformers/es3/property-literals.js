/* */ 
"use strict";
var t = require("../../../types/index");
exports.Property = function(node) {
  var key = node.key;
  if (t.isLiteral(key) && t.isValidIdentifier(key.value)) {
    node.key = t.identifier(key.value);
    node.computed = false;
  } else if (!node.computed && t.isIdentifier(key) && !t.isValidIdentifier(key.name)) {
    node.key = t.literal(key.name);
  }
};
