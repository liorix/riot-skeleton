/* */ 
"use strict";
var t = require("../../../types/index");
var isConsole = t.buildMatchMemberExpression("console", true);
exports.optional = true;
exports.CallExpression = function(node) {
  if (isConsole(node.callee)) {
    this.remove();
  }
};
