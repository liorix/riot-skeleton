/* */ 
"use strict";
exports.experimental = true;
var build = require("../../helpers/build-binary-assignment-operator-transformer");
var t = require("../../../types/index");
var MATH_POW = t.memberExpression(t.identifier("Math"), t.identifier("pow"));
build(exports, {
  operator: "**",
  build: function(left, right) {
    return t.callExpression(MATH_POW, [left, right]);
  }
});
