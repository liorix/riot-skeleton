/* */ 
"use strict";
module.exports = DefaultFormatter;
var object = require("../../helpers/object");
var util = require("../../util");
var t = require("../../types/index");
var extend = require("lodash/object/extend");
function DefaultFormatter(file) {
  this.file = file;
  this.ids = object();
  this.hasNonDefaultExports = false;
  this.hasLocalExports = false;
  this.hasLocalImports = false;
  this.localImportOccurences = object();
  this.localExports = object();
  this.localImports = object();
  this.getLocalExports();
  this.getLocalImports();
  this.remapAssignments();
}
DefaultFormatter.prototype.doDefaultExportInterop = function(node) {
  return node.default && !this.noInteropRequireExport && !this.hasNonDefaultExports;
};
DefaultFormatter.prototype.bumpImportOccurences = function(node) {
  var source = node.source.value;
  var occurs = this.localImportOccurences;
  occurs[source] = occurs[source] || 0;
  occurs[source] += node.specifiers.length;
};
var exportsVisitor = {enter: function(node, parent, scope, formatter) {
    var declar = node && node.declaration;
    if (t.isExportDeclaration(node)) {
      formatter.hasLocalImports = true;
      if (declar && t.isStatement(declar)) {
        extend(formatter.localExports, t.getBindingIdentifiers(declar));
      }
      if (!node.default) {
        formatter.hasNonDefaultExports = true;
      }
      if (node.source) {
        formatter.bumpImportOccurences(node);
      }
    }
  }};
DefaultFormatter.prototype.getLocalExports = function() {
  this.file.scope.traverse(this.file.ast, exportsVisitor, this);
};
var importsVisitor = {enter: function(node, parent, scope, formatter) {
    if (t.isImportDeclaration(node)) {
      formatter.hasLocalImports = true;
      extend(formatter.localImports, t.getBindingIdentifiers(node));
      formatter.bumpImportOccurences(node);
    }
  }};
DefaultFormatter.prototype.getLocalImports = function() {
  this.file.scope.traverse(this.file.ast, importsVisitor, this);
};
var remapVisitor = {enter: function(node, parent, scope, formatter) {
    if (t.isUpdateExpression(node) && formatter.isLocalReference(node.argument, scope)) {
      this.skip();
      var assign = t.assignmentExpression(node.operator[0] + "=", node.argument, t.literal(1));
      var remapped = formatter.remapExportAssignment(assign);
      if (t.isExpressionStatement(parent) || node.prefix) {
        return remapped;
      }
      var nodes = [];
      nodes.push(remapped);
      var operator;
      if (node.operator === "--") {
        operator = "+";
      } else {
        operator = "-";
      }
      nodes.push(t.binaryExpression(operator, node.argument, t.literal(1)));
      return t.sequenceExpression(nodes);
    }
    if (t.isAssignmentExpression(node) && formatter.isLocalReference(node.left, scope)) {
      this.skip();
      return formatter.remapExportAssignment(node);
    }
  }};
DefaultFormatter.prototype.remapAssignments = function() {
  if (this.hasLocalImports) {
    this.file.scope.traverse(this.file.ast, remapVisitor, this);
  }
};
DefaultFormatter.prototype.isLocalReference = function(node) {
  var localImports = this.localImports;
  return t.isIdentifier(node) && localImports[node.name] && localImports[node.name] !== node;
};
DefaultFormatter.prototype.checkLocalReference = function(node) {
  var file = this.file;
  if (this.isLocalReference(node)) {
    throw file.errorWithNode(node, "Illegal assignment of module import");
  }
};
DefaultFormatter.prototype.remapExportAssignment = function(node) {
  return t.assignmentExpression("=", node.left, t.assignmentExpression(node.operator, t.memberExpression(t.identifier("exports"), node.left), node.right));
};
DefaultFormatter.prototype.isLocalReference = function(node, scope) {
  var localExports = this.localExports;
  var name = node.name;
  return t.isIdentifier(node) && localExports[name] && localExports[name] === scope.getBinding(name);
};
DefaultFormatter.prototype.getModuleName = function() {
  var opts = this.file.opts;
  var filenameRelative = opts.filenameRelative;
  var moduleName = "";
  if (opts.moduleRoot) {
    moduleName = opts.moduleRoot + "/";
  }
  if (!opts.filenameRelative) {
    return moduleName + opts.filename.replace(/^\//, "");
  }
  if (opts.sourceRoot) {
    var sourceRootRegEx = new RegExp("^" + opts.sourceRoot + "\/?");
    filenameRelative = filenameRelative.replace(sourceRootRegEx, "");
  }
  if (!opts.keepModuleIdExtensions) {
    filenameRelative = filenameRelative.replace(/\.(\w*?)$/, "");
  }
  moduleName += filenameRelative;
  moduleName = moduleName.replace(/\\/g, "/");
  return moduleName;
};
DefaultFormatter.prototype._pushStatement = function(ref, nodes) {
  if (t.isClass(ref) || t.isFunction(ref)) {
    if (ref.id) {
      nodes.push(t.toStatement(ref));
      ref = ref.id;
    }
  }
  return ref;
};
DefaultFormatter.prototype._hoistExport = function(declar, assign, priority) {
  if (t.isFunctionDeclaration(declar)) {
    assign._blockHoist = priority || 2;
  }
  return assign;
};
DefaultFormatter.prototype.getExternalReference = function(node, nodes) {
  var ids = this.ids;
  var id = node.source.value;
  if (ids[id]) {
    return ids[id];
  } else {
    return this.ids[id] = this._getExternalReference(node, nodes);
  }
};
DefaultFormatter.prototype.checkExportIdentifier = function(node) {
  if (t.isIdentifier(node, {name: "__esModule"})) {
    throw this.file.errorWithNode(node, "Illegal export __esModule - this is used internally for CommonJS interop");
  }
};
DefaultFormatter.prototype.exportSpecifier = function(specifier, node, nodes) {
  var inherits = false;
  if (node.specifiers.length === 1)
    inherits = node;
  if (node.source) {
    var ref = this.getExternalReference(node, nodes);
    if (t.isExportBatchSpecifier(specifier)) {
      nodes.push(this.buildExportsWildcard(ref, node));
    } else {
      if (t.isSpecifierDefault(specifier) && !this.noInteropRequireExport) {
        ref = t.callExpression(this.file.addHelper("interop-require"), [ref]);
      } else {
        ref = t.memberExpression(ref, t.getSpecifierId(specifier));
      }
      nodes.push(this.buildExportsAssignment(t.getSpecifierName(specifier), ref, node));
    }
  } else {
    nodes.push(this.buildExportsAssignment(t.getSpecifierName(specifier), specifier.id, node));
  }
};
DefaultFormatter.prototype.buildExportsWildcard = function(objectIdentifier) {
  return t.expressionStatement(t.callExpression(this.file.addHelper("defaults"), [t.identifier("exports"), t.callExpression(this.file.addHelper("interop-require-wildcard"), [objectIdentifier])]));
};
DefaultFormatter.prototype.buildExportsAssignment = function(id, init) {
  this.checkExportIdentifier(id);
  return util.template("exports-assign", {
    VALUE: init,
    KEY: id
  }, true);
};
DefaultFormatter.prototype.exportDeclaration = function(node, nodes) {
  var declar = node.declaration;
  var id = declar.id;
  if (node.default) {
    id = t.identifier("default");
  }
  var assign;
  if (t.isVariableDeclaration(declar)) {
    for (var i = 0; i < declar.declarations.length; i++) {
      var decl = declar.declarations[i];
      decl.init = this.buildExportsAssignment(decl.id, decl.init, node).expression;
      var newDeclar = t.variableDeclaration(declar.kind, [decl]);
      if (i === 0)
        t.inherits(newDeclar, declar);
      nodes.push(newDeclar);
    }
  } else {
    var ref = declar;
    if (t.isFunctionDeclaration(declar) || t.isClassDeclaration(declar)) {
      ref = declar.id;
      nodes.push(declar);
    }
    assign = this.buildExportsAssignment(id, ref, node);
    nodes.push(assign);
    this._hoistExport(declar, assign);
  }
};
