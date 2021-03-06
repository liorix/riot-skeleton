/* */ 
"use strict";
var remapAsyncToGenerator = require("../../helpers/remap-async-to-generator");
var t = require("../../../types/index");
exports.manipulateOptions = function(opts) {
  opts.experimental = true;
  opts.blacklist.push("regenerator");
};
exports.optional = true;
exports.Function = function(node, parent, scope, file) {
  if (!node.async || node.generator)
    return ;
  return remapAsyncToGenerator(node, t.memberExpression(file.addImport("bluebird"), t.identifier("coroutine")), scope);
};
