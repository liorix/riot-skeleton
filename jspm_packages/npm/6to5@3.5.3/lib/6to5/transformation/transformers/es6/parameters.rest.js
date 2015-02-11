/* */ 
"use strict";
var util = require("../../../util");
var t = require("../../../types/index");
exports.check = t.isRestElement;
var hasRest = function(node) {
  return t.isRestElement(node.params[node.params.length - 1]);
};
exports.Function = function(node, parent, scope) {
  if (!hasRest(node))
    return ;
  var rest = node.params.pop().argument;
  var argsId = t.identifier("arguments");
  argsId._ignoreAliasFunctions = true;
  var start = t.literal(node.params.length);
  var key = scope.generateUidIdentifier("key");
  var len = scope.generateUidIdentifier("len");
  var arrKey = key;
  var arrLen = len;
  if (node.params.length) {
    arrKey = t.binaryExpression("-", key, start);
    arrLen = t.conditionalExpression(t.binaryExpression(">", len, start), t.binaryExpression("-", len, start), t.literal(0));
  }
  if (t.isPattern(rest)) {
    var pattern = rest;
    rest = scope.generateUidIdentifier("ref");
    var restDeclar = t.variableDeclaration("var", [t.variableDeclarator(pattern, rest)]);
    restDeclar._blockHoist = node.params.length + 1;
    node.body.body.unshift(restDeclar);
  }
  var loop = util.template("rest", {
    ARGUMENTS: argsId,
    ARRAY_KEY: arrKey,
    ARRAY_LEN: arrLen,
    START: start,
    ARRAY: rest,
    KEY: key,
    LEN: len
  });
  loop._blockHoist = node.params.length + 1;
  node.body.body.unshift(loop);
};
