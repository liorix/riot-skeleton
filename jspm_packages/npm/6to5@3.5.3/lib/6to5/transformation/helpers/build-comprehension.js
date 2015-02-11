/* */ 
"use strict";
var t = require("../../types/index");
module.exports = function build(node, buildBody) {
  var self = node.blocks.shift();
  if (!self)
    return ;
  var child = build(node, buildBody);
  if (!child) {
    child = buildBody();
    if (node.filter) {
      child = t.ifStatement(node.filter, t.blockStatement([child]));
    }
  }
  return t.forOfStatement(t.variableDeclaration("let", [t.variableDeclarator(self.left)]), self.right, t.blockStatement([child]));
};
