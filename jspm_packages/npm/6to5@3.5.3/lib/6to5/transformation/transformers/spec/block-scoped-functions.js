/* */ 
"use strict";
var t = require("../../../types/index");
exports.BlockStatement = function(node, parent, scope, file) {
  if ((t.isFunction(parent) && parent.body === node) || t.isExportDeclaration(parent)) {
    return ;
  }
  for (var i = 0; i < node.body.length; i++) {
    var func = node.body[i];
    if (!t.isFunctionDeclaration(func))
      continue;
    var declar = t.variableDeclaration("let", [t.variableDeclarator(func.id, t.toExpression(func))]);
    declar._blockHoist = 2;
    func.id = null;
    node.body[i] = declar;
    file.checkNode(declar);
  }
};
