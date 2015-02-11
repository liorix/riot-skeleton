/* */ 
"use strict";
var t = require("../../../types/index");
exports.check = function(node) {
  return t.isVariableDeclaration(node, {kind: "const"});
};
var visitor = {enter: function(node, parent, scope, state) {
    if (t.isAssignmentExpression(node) || t.isUpdateExpression(node)) {
      var ids = t.getBindingIdentifiers(node);
      for (var key in ids) {
        var id = ids[key];
        var constant = state.constants[key];
        if (!constant)
          continue;
        if (id === constant)
          continue;
        if (!scope.bindingEquals(key, constant))
          continue;
        throw state.file.errorWithNode(id, key + " is read-only");
      }
    } else if (t.isScope(node)) {
      this.skip();
    }
  }};
exports.Scope = function(node, parent, scope, file) {
  scope.traverse(node, visitor, {
    constants: scope.getAllDeclarationsOfKind("const"),
    file: file
  });
};
exports.VariableDeclaration = function(node) {
  if (node.kind === "const")
    node.kind = "let";
};
