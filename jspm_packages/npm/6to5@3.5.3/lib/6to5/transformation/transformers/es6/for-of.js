/* */ 
"use strict";
var util = require("../../../util");
var t = require("../../../types/index");
exports.check = t.isForOfStatement;
exports.ForOfStatement = function(node, parent, scope, file) {
  var callback = spec;
  if (file.isLoose("es6.forOf"))
    callback = loose;
  var build = callback(node, parent, scope, file);
  var declar = build.declar;
  var loop = build.loop;
  var block = loop.body;
  t.inheritsComments(loop, node);
  t.ensureBlock(node);
  if (declar) {
    block.body.push(declar);
  }
  block.body = block.body.concat(node.body.body);
  t.inherits(loop, node);
  loop._scopeInfo = node._scopeInfo;
  return loop;
};
var loose = function(node, parent, scope, file) {
  var left = node.left;
  var declar,
      id;
  if (t.isIdentifier(left) || t.isPattern(left)) {
    id = left;
  } else if (t.isVariableDeclaration(left)) {
    id = scope.generateUidIdentifier("ref");
    declar = t.variableDeclaration(left.kind, [t.variableDeclarator(left.declarations[0].id, id)]);
  } else {
    throw file.errorWithNode(left, "Unknown node type " + left.type + " in ForOfStatement");
  }
  var loop = util.template("for-of-loose", {
    LOOP_OBJECT: scope.generateUidIdentifier("iterator"),
    IS_ARRAY: scope.generateUidIdentifier("isArray"),
    OBJECT: node.right,
    INDEX: scope.generateUidIdentifier("i"),
    ID: id
  });
  if (!declar) {
    loop.body.body.shift();
  }
  return {
    declar: declar,
    loop: loop
  };
};
var spec = function(node, parent, scope, file) {
  var left = node.left;
  var declar;
  var stepKey = scope.generateUidIdentifier("step");
  var stepValue = t.memberExpression(stepKey, t.identifier("value"));
  if (t.isIdentifier(left) || t.isPattern(left)) {
    declar = t.expressionStatement(t.assignmentExpression("=", left, stepValue));
  } else if (t.isVariableDeclaration(left)) {
    declar = t.variableDeclaration(left.kind, [t.variableDeclarator(left.declarations[0].id, stepValue)]);
  } else {
    throw file.errorWithNode(left, "Unknown node type " + left.type + " in ForOfStatement");
  }
  var loop = util.template("for-of", {
    ITERATOR_KEY: scope.generateUidIdentifier("iterator"),
    STEP_KEY: stepKey,
    OBJECT: node.right
  });
  return {
    declar: declar,
    loop: loop
  };
};
