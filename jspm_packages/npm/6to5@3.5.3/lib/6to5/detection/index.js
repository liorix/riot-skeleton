/* */ 
module.exports = detect;
var SYNTAX_KEYS = require("./syntax-keys.json!systemjs-json");
var traverse = require("../traversal/index");
var visitors = traverse.explode(require("./visitors"));
function detect(ast) {
  var stats = {
    syntax: {},
    builtins: {}
  };
  var detectedSyntax = function(name) {
    stats.syntax[name] = true;
  };
  traverse(ast, {enter: function(node, parent) {
      if (SYNTAX_KEYS[node.type]) {
        detectedSyntax(SYNTAX_KEYS[node.type]);
      }
      var visitor = visitors[node.type];
      if (visitor)
        visitor(node, parent, detectedSyntax);
    }});
  return stats;
}
