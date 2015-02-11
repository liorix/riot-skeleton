/* */ 
"use strict";
var toFastProperties = require("../helpers/to-fast-properties");
var defaults = require("lodash/object/defaults");
var isString = require("lodash/lang/isString");
var compact = require("lodash/array/compact");
var esutils = require("esutils");
var object = require("../helpers/object");
var Node = require("./node");
var each = require("lodash/collection/each");
var uniq = require("lodash/array/uniq");
var t = exports;
function registerType(type, skipAliasCheck) {
  var is = t["is" + type] = function(node, opts) {
    return t.is(type, node, opts, skipAliasCheck);
  };
  t["assert" + type] = function(node, opts) {
    opts = opts || {};
    if (!is(node, opts)) {
      throw new Error("Expected type " + JSON.stringify(type) + " with option " + JSON.stringify(opts));
    }
  };
}
t.STATEMENT_OR_BLOCK_KEYS = ["consequent", "body"];
t.NATIVE_TYPE_NAMES = ["Array", "Object", "Number", "Boolean", "Date", "Array", "String"];
t.FOR_INIT_KEYS = ["left", "init"];
t.VISITOR_KEYS = require("./visitor-keys.json!systemjs-json");
t.ALIAS_KEYS = require("./alias-keys.json!systemjs-json");
t.FLIPPED_ALIAS_KEYS = {};
each(t.VISITOR_KEYS, function(keys, type) {
  registerType(type, true);
});
each(t.ALIAS_KEYS, function(aliases, type) {
  each(aliases, function(alias) {
    var types = t.FLIPPED_ALIAS_KEYS[alias] = t.FLIPPED_ALIAS_KEYS[alias] || [];
    types.push(type);
  });
});
each(t.FLIPPED_ALIAS_KEYS, function(types, type) {
  t[type.toUpperCase() + "_TYPES"] = types;
  registerType(type, false);
});
t.is = function(type, node, opts, skipAliasCheck) {
  if (!node)
    return ;
  var typeMatches = (type === node.type);
  if (!typeMatches && !skipAliasCheck) {
    var aliases = t.FLIPPED_ALIAS_KEYS[type];
    if (typeof aliases !== "undefined") {
      typeMatches = aliases.indexOf(node.type) > -1;
    }
  }
  if (!typeMatches) {
    return false;
  }
  if (typeof opts !== "undefined") {
    return t.shallowEqual(node, opts);
  }
  return true;
};
t.BUILDER_KEYS = defaults(require("./builder-keys.json!systemjs-json"), t.VISITOR_KEYS);
each(t.BUILDER_KEYS, function(keys, type) {
  t[type[0].toLowerCase() + type.slice(1)] = function() {
    var args = arguments;
    var node = new Node;
    node.start = null;
    node.type = type;
    each(keys, function(key, i) {
      node[key] = args[i];
    });
    return node;
  };
});
t.toComputedKey = function(node, key) {
  if (!node.computed) {
    if (t.isIdentifier(key))
      key = t.literal(key.name);
  }
  return key;
};
t.isFalsyExpression = function(node) {
  if (t.isLiteral(node)) {
    return !node.value;
  } else if (t.isIdentifier(node)) {
    return node.name === "undefined";
  }
  return false;
};
t.toSequenceExpression = function(nodes, scope) {
  var exprs = [];
  each(nodes, function(node) {
    if (t.isExpression(node)) {
      exprs.push(node);
    }
    if (t.isExpressionStatement(node)) {
      exprs.push(node.expression);
    } else if (t.isVariableDeclaration(node)) {
      each(node.declarations, function(declar) {
        scope.push({
          kind: node.kind,
          key: declar.id.name,
          id: declar.id
        });
        exprs.push(t.assignmentExpression("=", declar.id, declar.init));
      });
    }
  });
  if (exprs.length === 1) {
    return exprs[0];
  } else {
    return t.sequenceExpression(exprs);
  }
};
t.shallowEqual = function(actual, expected) {
  var keys = Object.keys(expected);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (actual[key] !== expected[key]) {
      return false;
    }
  }
  return true;
};
t.appendToMemberExpression = function(member, append, computed) {
  member.object = t.memberExpression(member.object, member.property, member.computed);
  member.property = append;
  member.computed = !!computed;
  return member;
};
t.prependToMemberExpression = function(member, append) {
  member.object = t.memberExpression(append, member.object);
  return member;
};
t.isReferenced = function(node, parent) {
  if (t.isMemberExpression(parent)) {
    if (parent.property === node && parent.computed) {
      return true;
    } else if (parent.object === node) {
      return true;
    } else {
      return false;
    }
  }
  if (t.isProperty(parent) && parent.key === node) {
    return parent.computed;
  }
  if (t.isVariableDeclarator(parent)) {
    return parent.id !== node;
  }
  if (t.isFunction(parent)) {
    for (var i = 0; i < parent.params.length; i++) {
      var param = parent.params[i];
      if (param === node)
        return false;
    }
    return parent.id !== node;
  }
  if (t.isClass(parent)) {
    return parent.id !== node;
  }
  if (t.isMethodDefinition(parent)) {
    return parent.key === node && parent.computed;
  }
  if (t.isLabeledStatement(parent)) {
    return false;
  }
  if (t.isCatchClause(parent)) {
    return parent.param !== node;
  }
  if (t.isRestElement(parent)) {
    return false;
  }
  if (t.isAssignmentPattern(parent)) {
    return parent.right !== node;
  }
  if (t.isPattern(parent)) {
    return false;
  }
  if (t.isImportSpecifier(parent)) {
    return false;
  }
  if (t.isImportBatchSpecifier(parent)) {
    return false;
  }
  if (t.isPrivateDeclaration(parent)) {
    return false;
  }
  return true;
};
t.isReferencedIdentifier = function(node, parent, opts) {
  return t.isIdentifier(node, opts) && t.isReferenced(node, parent);
};
t.isValidIdentifier = function(name) {
  return isString(name) && esutils.keyword.isIdentifierName(name) && !esutils.keyword.isReservedWordES6(name, true);
};
t.toIdentifier = function(name) {
  if (t.isIdentifier(name))
    return name.name;
  name = name + "";
  name = name.replace(/[^a-zA-Z0-9$_]/g, "-");
  name = name.replace(/^[-0-9]+/, "");
  name = name.replace(/[-\s]+(.)?/g, function(match, c) {
    return c ? c.toUpperCase() : "";
  });
  if (!t.isValidIdentifier(name)) {
    name = "_" + name;
  }
  return name || "_";
};
t.ensureBlock = function(node, key) {
  key = key || "body";
  return node[key] = t.toBlock(node[key], node);
};
t.buildMatchMemberExpression = function(match, allowPartial) {
  var parts = match.split(".");
  return function(member) {
    if (!t.isMemberExpression(member))
      return false;
    var search = [member];
    var i = 0;
    while (search.length) {
      var node = search.shift();
      if (t.isIdentifier(node)) {
        if (parts[i] !== node.name)
          return false;
      } else if (t.isLiteral(node)) {
        if (parts[i] !== node.value)
          return false;
      } else if (t.isMemberExpression(node)) {
        if (node.computed && !t.isLiteral(node.property)) {
          return false;
        } else {
          search.push(node.object);
          search.push(node.property);
          continue;
        }
      } else {
        return false;
      }
      if (++i > parts.length) {
        if (allowPartial) {
          return true;
        } else {
          return false;
        }
      }
    }
    return true;
  };
};
t.toStatement = function(node, ignore) {
  if (t.isStatement(node)) {
    return node;
  }
  var mustHaveId = false;
  var newType;
  if (t.isClass(node)) {
    mustHaveId = true;
    newType = "ClassDeclaration";
  } else if (t.isFunction(node)) {
    mustHaveId = true;
    newType = "FunctionDeclaration";
  } else if (t.isAssignmentExpression(node)) {
    return t.expressionStatement(node);
  }
  if (mustHaveId && !node.id) {
    newType = false;
  }
  if (!newType) {
    if (ignore) {
      return false;
    } else {
      throw new Error("cannot turn " + node.type + " to a statement");
    }
  }
  node.type = newType;
  return node;
};
exports.toExpression = function(node) {
  if (t.isExpressionStatement(node)) {
    node = node.expression;
  }
  if (t.isClass(node)) {
    node.type = "ClassExpression";
  } else if (t.isFunction(node)) {
    node.type = "FunctionExpression";
  }
  if (t.isExpression(node)) {
    return node;
  } else {
    throw new Error("cannot turn " + node.type + " to an expression");
  }
};
t.toBlock = function(node, parent) {
  if (t.isBlockStatement(node)) {
    return node;
  }
  if (t.isEmptyStatement(node)) {
    node = [];
  }
  if (!Array.isArray(node)) {
    if (!t.isStatement(node)) {
      if (t.isFunction(parent)) {
        node = t.returnStatement(node);
      } else {
        node = t.expressionStatement(node);
      }
    }
    node = [node];
  }
  return t.blockStatement(node);
};
t.getBindingIdentifiers = function(node) {
  var search = [].concat(node);
  var ids = object();
  while (search.length) {
    var id = search.shift();
    if (!id)
      continue;
    var keys = t.getBindingIdentifiers.keys[id.type];
    if (t.isIdentifier(id)) {
      ids[id.name] = id;
    } else if (t.isExportDeclaration(id)) {
      if (t.isDeclaration(node.declaration)) {
        search.push(node.declaration);
      }
    } else if (keys) {
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        search = search.concat(id[key] || []);
      }
    }
  }
  return ids;
};
t.getBindingIdentifiers.keys = {
  AssignmentExpression: ["left"],
  ImportBatchSpecifier: ["name"],
  ImportSpecifier: ["name", "id"],
  ExportSpecifier: ["name", "id"],
  VariableDeclarator: ["id"],
  FunctionDeclaration: ["id"],
  ClassDeclaration: ["id"],
  MemeberExpression: ["object"],
  SpreadElement: ["argument"],
  RestElement: ["argument"],
  UpdateExpression: ["argument"],
  Property: ["value"],
  ComprehensionBlock: ["left"],
  AssignmentPattern: ["left"],
  PrivateDeclaration: ["declarations"],
  ComprehensionExpression: ["blocks"],
  ImportDeclaration: ["specifiers"],
  VariableDeclaration: ["declarations"],
  ArrayPattern: ["elements"],
  ObjectPattern: ["properties"]
};
t.isLet = function(node) {
  return t.isVariableDeclaration(node) && (node.kind !== "var" || node._let);
};
t.isBlockScoped = function(node) {
  return t.isFunctionDeclaration(node) || t.isClassDeclaration(node) || t.isLet(node);
};
t.isVar = function(node) {
  return t.isVariableDeclaration(node, {kind: "var"}) && !node._let;
};
t.COMMENT_KEYS = ["leadingComments", "trailingComments"];
t.removeComments = function(child) {
  each(t.COMMENT_KEYS, function(key) {
    delete child[key];
  });
  return child;
};
t.inheritsComments = function(child, parent) {
  each(t.COMMENT_KEYS, function(key) {
    child[key] = uniq(compact([].concat(child[key], parent[key])));
  });
  return child;
};
t.inherits = function(child, parent) {
  child._declarations = parent._declarations;
  child._scopeInfo = parent._scopeInfo;
  child.range = parent.range;
  child.start = parent.start;
  child.loc = parent.loc;
  child.end = parent.end;
  t.inheritsComments(child, parent);
  return child;
};
t.getLastStatements = function(node) {
  var nodes = [];
  var add = function(node) {
    nodes = nodes.concat(t.getLastStatements(node));
  };
  if (t.isIfStatement(node)) {
    add(node.consequent);
    add(node.alternate);
  } else if (t.isFor(node) || t.isWhile(node)) {
    add(node.body);
  } else if (t.isProgram(node) || t.isBlockStatement(node)) {
    add(node.body[node.body.length - 1]);
  } else if (node) {
    nodes.push(node);
  }
  return nodes;
};
t.getSpecifierName = function(specifier) {
  return specifier.name || specifier.id;
};
t.getSpecifierId = function(specifier) {
  if (specifier.default) {
    return t.identifier("default");
  } else {
    return specifier.id;
  }
};
t.isSpecifierDefault = function(specifier) {
  return specifier.default || t.isIdentifier(specifier.id) && specifier.id.name === "default";
};
toFastProperties(t);
toFastProperties(t.VISITOR_KEYS);
