/* */ 
var t = require("../../types/index");
var isCreateClassCallExpression = t.buildMatchMemberExpression("React.createClass");
exports.isCreateClass = function(node) {
  if (!node || !t.isCallExpression(node))
    return false;
  if (!isCreateClassCallExpression(node.callee))
    return false;
  var args = node.arguments;
  if (args.length !== 1)
    return false;
  var first = args[0];
  if (!t.isObjectExpression(first))
    return false;
  return true;
};
exports.isReactComponent = t.buildMatchMemberExpression("React.Component");
exports.isCompatTag = function(tagName) {
  return tagName && /^[a-z]|\-/.test(tagName);
};
