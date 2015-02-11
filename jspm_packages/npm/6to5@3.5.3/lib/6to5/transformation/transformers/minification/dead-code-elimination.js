/* */ 
var t = require("../../../types/index");
exports.optional = true;
exports.ExpressionStatement = function(node) {
  var expr = node.expression;
  if (t.isLiteral(expr) || (t.isIdentifier(node) && t.hasBinding(node.name))) {
    this.remove();
  }
};
exports.IfStatement = {exit: function(node) {
    var consequent = node.consequent;
    var alternate = node.alternate;
    var test = node.test;
    if (t.isLiteral(test) && test.value) {
      return alternate;
    }
    if (t.isFalsyExpression(test)) {
      if (alternate) {
        return alternate;
      } else {
        return this.remove();
      }
    }
    if (t.isBlockStatement(alternate) && !alternate.body.length) {
      alternate = node.alternate = null;
    }
    if (t.blockStatement(consequent) && !consequent.body.length && t.isBlockStatement(alternate) && alternate.body.length) {
      node.consequent = node.alternate;
      node.alternate = null;
      node.test = t.unaryExpression("!", test, true);
    }
  }};
