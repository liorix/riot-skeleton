/* */ 
"use strict";
var t = require("../../../types/index");
exports.check = t.isArrowFunctionExpression;
exports.ArrowFunctionExpression = function(node) {
  t.ensureBlock(node);
  node._aliasFunction = "arrow";
  node.expression = false;
  node.type = "FunctionExpression";
  return node;
};
