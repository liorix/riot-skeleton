/* */ 
"use strict";
var extend = require("lodash/object/extend");
var t = require("./types/index");
require("./types/node");
var estraverse = require("estraverse");
extend(estraverse.VisitorKeys, t.VISITOR_KEYS);
var types = require("ast-types");
var def = types.Type.def;
var or = types.Type.or;
def("File").bases("Node").build("program").field("program", def("Program"));
def("AssignmentPattern").bases("Pattern").build("left", "right").field("left", def("Pattern")).field("right", def("Expression"));
def("ImportBatchSpecifier").bases("Specifier").build("name").field("name", def("Identifier"));
def("RestElement").bases("Pattern").build("argument").field("argument", def("expression"));
def("VirtualPropertyExpression").bases("Expression").build("object", "property").field("object", def("Expression")).field("property", or(def("Identifier"), def("Expression")));
def("PrivateDeclaration").bases("Declaration").build("declarations").field("declarations", [def("Identifier")]);
def("BindMemberExpression").bases("Expression").build("object", "property", "arguments").field("object", def("Expression")).field("property", or(def("Identifier"), def("Expression"))).field("arguments", [def("Expression")]);
def("BindFunctionExpression").bases("Expression").build("callee", "arguments").field("callee", def("Expression")).field("arguments", [def("Expression")]);
types.finalize();
