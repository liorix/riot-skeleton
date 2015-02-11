/* */ 
"use strict";
var util = require("../../../util");
var core = require("core-js/library");
var t = require("../../../types/index");
var has = require("lodash/object/has");
var contains = require("lodash/collection/contains");
var coreHas = function(node) {
  return node.name !== "_" && has(core, node.name);
};
var ALIASABLE_CONSTRUCTORS = ["Symbol", "Promise", "Map", "WeakMap", "Set", "WeakSet"];
var astVisitor = {enter: function(node, parent, scope, file) {
    var prop;
    if (t.isMemberExpression(node) && t.isReferenced(node, parent)) {
      var obj = node.object;
      prop = node.property;
      if (!t.isReferenced(obj, node))
        return ;
      if (!node.computed && coreHas(obj) && has(core[obj.name], prop.name) && !scope.getBinding(obj.name)) {
        this.skip();
        return t.prependToMemberExpression(node, file.get("coreIdentifier"));
      }
    } else if (t.isReferencedIdentifier(node, parent) && !t.isMemberExpression(parent) && contains(ALIASABLE_CONSTRUCTORS, node.name) && !scope.getBinding(node.name)) {
      return t.memberExpression(file.get("coreIdentifier"), node);
    } else if (t.isCallExpression(node)) {
      if (node.arguments.length)
        return ;
      var callee = node.callee;
      if (!t.isMemberExpression(callee))
        return ;
      if (!callee.computed)
        return ;
      prop = callee.property;
      if (!t.isIdentifier(prop.object, {name: "Symbol"}))
        return ;
      if (!t.isIdentifier(prop.property, {name: "iterator"}))
        return ;
      return util.template("corejs-iterator", {
        CORE_ID: file.get("coreIdentifier"),
        VALUE: callee.object
      });
    }
  }};
exports.optional = true;
exports.manipulateOptions = function(opts) {
  if (opts.whitelist.length)
    opts.whitelist.push("es6.modules");
};
exports.post = function(file) {
  file.scope.traverse(file.ast, astVisitor, file);
};
exports.pre = function(file) {
  file.setDynamic("runtimeIdentifier", function() {
    return file.addImport("6to5-runtime/helpers", "to5Helpers");
  });
  file.setDynamic("coreIdentifier", function() {
    return file.addImport("6to5-runtime/core-js", "core");
  });
  file.setDynamic("regeneratorIdentifier", function() {
    return file.addImport("6to5-runtime/regenerator", "regeneratorRuntime");
  });
};
exports.Identifier = function(node, parent, scope, file) {
  if (node.name === "regeneratorRuntime" && t.isReferenced(node, parent)) {
    return file.get("regeneratorIdentifier");
  }
};