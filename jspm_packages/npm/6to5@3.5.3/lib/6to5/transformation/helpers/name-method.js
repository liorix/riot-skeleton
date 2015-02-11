/* */ 
"use strict";
var util = require("../../util");
var t = require("../../types/index");
var visitor = {enter: function(node, parent, scope, state) {
    if (!t.isIdentifier(node, {name: state.id}))
      return ;
    if (!t.isReferenced(node, parent))
      return ;
    var localDeclar = scope.getBinding(state.id);
    if (localDeclar !== state.outerDeclar)
      return ;
    state.selfReference = true;
    this.stop();
  }};
exports.property = function(node, file, scope) {
  var key = t.toComputedKey(node, node.key);
  if (!t.isLiteral(key))
    return node;
  var id = t.toIdentifier(key.value);
  key = t.identifier(id);
  var state = {
    id: id,
    selfReference: false,
    outerDeclar: scope.getBinding(id)
  };
  scope.traverse(node, visitor, state);
  var method = node.value;
  if (state.selfReference) {
    var templateName = "property-method-assignment-wrapper";
    if (method.generator)
      templateName += "-generator";
    node.value = util.template(templateName, {
      FUNCTION: method,
      FUNCTION_ID: key,
      FUNCTION_KEY: scope.generateUidIdentifier(id),
      WRAPPER_KEY: scope.generateUidIdentifier(id + "Wrapper")
    });
  } else {
    method.id = key;
  }
};
