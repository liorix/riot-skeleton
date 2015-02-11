/* */ 
"use strict";
var t = require("../../../types/index");
exports.check = require("../internal/modules").check;
exports.ImportDeclaration = function(node, parent, scope, file) {
  var nodes = [];
  if (node.specifiers.length) {
    for (var i = 0; i < node.specifiers.length; i++) {
      file.moduleFormatter.importSpecifier(node.specifiers[i], node, nodes, parent);
    }
  } else {
    file.moduleFormatter.importDeclaration(node, nodes, parent);
  }
  if (nodes.length === 1) {
    nodes[0]._blockHoist = node._blockHoist;
  }
  return nodes;
};
exports.ExportDeclaration = function(node, parent, scope, file) {
  var nodes = [];
  var i;
  if (node.declaration) {
    if (t.isVariableDeclaration(node.declaration)) {
      var declar = node.declaration.declarations[0];
      declar.init = declar.init || t.identifier("undefined");
    }
    file.moduleFormatter.exportDeclaration(node, nodes, parent);
  } else if (node.specifiers) {
    for (i = 0; i < node.specifiers.length; i++) {
      file.moduleFormatter.exportSpecifier(node.specifiers[i], node, nodes, parent);
    }
  }
  if (node._blockHoist) {
    for (i = 0; i < nodes.length; i++) {
      nodes[i]._blockHoist = node._blockHoist;
    }
  }
  return nodes;
};
