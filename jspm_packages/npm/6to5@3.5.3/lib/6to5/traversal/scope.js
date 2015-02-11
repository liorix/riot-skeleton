/* */ 
"use strict";
module.exports = Scope;
var contains = require("lodash/collection/contains");
var traverse = require("./index");
var defaults = require("lodash/object/defaults");
var globals = require("globals");
var flatten = require("lodash/array/flatten");
var extend = require("lodash/object/extend");
var object = require("../helpers/object");
var each = require("lodash/collection/each");
var has = require("lodash/object/has");
var t = require("../types/index");
function Scope(block, parentBlock, parent, file) {
  this.parent = parent;
  this.file = parent ? parent.file : file;
  this.parentBlock = parentBlock;
  this.block = block;
  this.crawl();
}
Scope.defaultDeclarations = flatten([globals.builtin, globals.browser, globals.node].map(Object.keys));
Scope.prototype.traverse = function(node, opts, state) {
  traverse(node, opts, this, state);
};
Scope.prototype.generateTemp = function(file, name) {
  var id = file.generateUidIdentifier(name || "temp", this);
  this.push({
    key: id.name,
    id: id
  });
  return id;
};
Scope.prototype.generateUidIdentifier = function(name) {
  return this.file.generateUidIdentifier(name, this);
};
Scope.prototype.generateUidBasedOnNode = function(parent) {
  var node = parent;
  if (t.isAssignmentExpression(parent)) {
    node = parent.left;
  } else if (t.isVariableDeclarator(parent)) {
    node = parent.id;
  } else if (t.isProperty(node)) {
    node = node.key;
  }
  var parts = [];
  var add = function(node) {
    if (t.isMemberExpression(node)) {
      add(node.object);
      add(node.property);
    } else if (t.isIdentifier(node)) {
      parts.push(node.name);
    } else if (t.isLiteral(node)) {
      parts.push(node.value);
    } else if (t.isCallExpression(node)) {
      add(node.callee);
    }
  };
  add(node);
  var id = parts.join("$");
  id = id.replace(/^_/, "") || "ref";
  return this.file.generateUidIdentifier(id, this);
};
Scope.prototype.generateTempBasedOnNode = function(node) {
  if (t.isIdentifier(node) && this.hasBinding(node.name)) {
    return null;
  }
  var id = this.generateUidBasedOnNode(node);
  this.push({
    key: id.name,
    id: id
  });
  return id;
};
Scope.prototype.checkBlockScopedCollisions = function(key, id) {
  if (this.declarationKinds["let"][key] || this.declarationKinds["const"][key]) {
    throw this.file.errorWithNode(id, "Duplicate declaration " + key, TypeError);
  }
};
Scope.prototype.inferType = function(node) {
  var target;
  if (t.isVariableDeclarator(node)) {
    target = node.init;
  }
  if (t.isLiteral(target) || t.isArrayExpression(target) || t.isObjectExpression(target)) {}
  if (t.isCallExpression(target)) {}
  if (t.isMemberExpression(target)) {}
  if (t.isIdentifier(target)) {
    return this.getType(target.name);
  }
};
Scope.prototype.registerType = function(key, id, node) {
  var type;
  if (id.typeAnnotation) {
    type = id.typeAnnotation;
  }
  if (!type) {
    type = this.inferType(node);
  }
  if (type) {
    if (t.isTypeAnnotation(type))
      type = type.typeAnnotation;
    this.types[key] = type;
  }
};
Scope.prototype.register = function(node, reference, kind) {
  if (t.isVariableDeclaration(node)) {
    return this.registerVariableDeclaration(node);
  }
  var ids = t.getBindingIdentifiers(node);
  extend(this.references, ids);
  if (reference)
    return ;
  for (var key in ids) {
    var id = ids[key];
    this.checkBlockScopedCollisions(key, id);
    this.registerType(key, id, node);
    this.bindings[key] = id;
  }
  var kinds = this.declarationKinds[kind];
  if (kinds)
    extend(kinds, ids);
};
Scope.prototype.registerVariableDeclaration = function(declar) {
  var declars = declar.declarations;
  for (var i = 0; i < declars.length; i++) {
    this.register(declars[i], false, declar.kind);
  }
};
var functionVariableVisitor = {enter: function(node, parent, scope, state) {
    if (t.isFor(node)) {
      each(t.FOR_INIT_KEYS, function(key) {
        var declar = node[key];
        if (t.isVar(declar))
          state.scope.register(declar);
      });
    }
    if (t.isFunction(node))
      return this.skip();
    if (state.blockId && node === state.blockId)
      return ;
    if (t.isBlockScoped(node))
      return ;
    if (t.isExportDeclaration(node) && t.isDeclaration(node.declaration))
      return ;
    if (t.isDeclaration(node))
      state.scope.register(node);
  }};
var programReferenceVisitor = {enter: function(node, parent, scope, state) {
    if (t.isReferencedIdentifier(node, parent) && !scope.hasReference(node.name)) {
      state.register(node, true);
    }
  }};
var blockVariableVisitor = {enter: function(node, parent, scope, state) {
    if (t.isBlockScoped(node)) {
      state.register(node);
    } else if (t.isScope(node)) {
      this.skip();
    }
  }};
Scope.prototype.crawl = function() {
  var parent = this.parent;
  var block = this.block;
  var i;
  var info = block._scopeInfo;
  if (info) {
    extend(this, info);
    return ;
  }
  info = block._scopeInfo = {
    declarationKinds: {
      "const": object(),
      "var": object(),
      "let": object()
    },
    references: object(),
    bindings: object(),
    types: object()
  };
  extend(this, info);
  if (parent && t.isBlockStatement(block)) {
    if (t.isLoop(parent.block, {body: block}) || t.isFunction(parent.block, {body: block})) {
      return ;
    }
  }
  if (t.isLoop(block)) {
    for (i = 0; i < t.FOR_INIT_KEYS.length; i++) {
      var node = block[t.FOR_INIT_KEYS[i]];
      if (t.isBlockScoped(node))
        this.register(node, false, true);
    }
    if (t.isBlockStatement(block.body)) {
      block = block.body;
    }
  }
  if (t.isFunctionExpression(block) && block.id) {
    if (!t.isProperty(this.parentBlock, {method: true})) {
      this.register(block.id);
    }
  }
  if (t.isFunction(block)) {
    for (i = 0; i < block.params.length; i++) {
      this.register(block.params[i]);
    }
    this.traverse(block.body, blockVariableVisitor, this);
  }
  if (t.isBlockStatement(block) || t.isProgram(block)) {
    this.traverse(block, blockVariableVisitor, this);
  }
  if (t.isCatchClause(block)) {
    this.register(block.param);
  }
  if (t.isComprehensionExpression(block)) {
    this.register(block);
  }
  if (t.isProgram(block) || t.isFunction(block)) {
    this.traverse(block, functionVariableVisitor, {
      blockId: block.id,
      scope: this
    });
  }
  if (t.isProgram(block)) {
    this.traverse(block, programReferenceVisitor, this);
  }
};
Scope.prototype.push = function(opts) {
  var block = this.block;
  if (t.isFor(block) || t.isCatchClause(block) || t.isFunction(block)) {
    t.ensureBlock(block);
    block = block.body;
  }
  if (t.isBlockStatement(block) || t.isProgram(block)) {
    block._declarations = block._declarations || {};
    block._declarations[opts.key] = {
      kind: opts.kind,
      id: opts.id,
      init: opts.init
    };
  } else {
    throw new TypeError("cannot add a declaration here in node type " + block.type);
  }
};
Scope.prototype.addDeclarationToFunctionScope = function(kind, node) {
  var scope = this.getFunctionParent();
  var ids = t.getBindingIdentifiers(node);
  extend(scope.bindings, ids);
  extend(scope.references, ids);
  extend(scope.declarationKinds[kind], ids);
};
Scope.prototype.getFunctionParent = function() {
  var scope = this;
  while (scope.parent && !t.isFunction(scope.block)) {
    scope = scope.parent;
  }
  return scope;
};
Scope.prototype.getAllBindings = function() {
  var ids = object();
  var scope = this;
  do {
    defaults(ids, scope.bindings);
    scope = scope.parent;
  } while (scope);
  return ids;
};
Scope.prototype.getAllDeclarationsOfKind = function(kind) {
  var ids = object();
  var scope = this;
  do {
    defaults(ids, scope.declarationKinds[kind]);
    scope = scope.parent;
  } while (scope);
  return ids;
};
Scope.prototype.get = function(id, type) {
  return id && (this.getOwn(id, type) || this.parentGet(id, type));
};
Scope.prototype.getOwn = function(id, type) {
  var refs = {
    reference: this.references,
    binding: this.bindings,
    type: this.types
  }[type];
  return refs && has(refs, id) && refs[id];
};
Scope.prototype.parentGet = function(id, type) {
  return this.parent && this.parent.get(id, type);
};
Scope.prototype.has = function(id, type) {
  if (!id)
    return false;
  if (this.hasOwn(id, type))
    return true;
  if (this.parentHas(id, type))
    return true;
  if (contains(Scope.defaultDeclarations, id))
    return true;
  return false;
};
Scope.prototype.hasOwn = function(id, type) {
  return !!this.getOwn(id, type);
};
Scope.prototype.parentHas = function(id, type) {
  return this.parent && this.parent.has(id, type);
};
each({
  reference: "Reference",
  binding: "Binding",
  type: "Type"
}, function(title, type) {
  Scope.prototype[type + "Equals"] = function(id, node) {
    return this["get" + title](id) === node;
  };
  each(["get", "has", "getOwn", "hasOwn", "parentGet", "parentHas"], function(methodName) {
    Scope.prototype[methodName + title] = function(id) {
      return this[methodName](id, type);
    };
  });
});
