/* */ 
"use strict";
var levenshtein = require("../../../helpers/levenshtein");
var t = require("../../../types/index");
exports.optional = true;
exports.Identifier = function(node, parent, scope, file) {
  if (!t.isReferenced(node, parent))
    return ;
  if (scope.hasBinding(node.name))
    return ;
  var msg = "Reference to undeclared variable";
  var bindings = scope.getAllBindings();
  var closest;
  var shortest = -1;
  for (var name in bindings) {
    var distance = levenshtein(node.name, name);
    if (distance <= 0 || distance > 3)
      continue;
    if (distance <= shortest)
      continue;
    closest = name;
    shortest = distance;
  }
  if (closest) {
    msg += " - Did you mean " + closest + "?";
  }
  throw file.errorWithNode(node, msg, ReferenceError);
};
