/* */ 
"use strict";
var Agent = require("../index").Agent,
    semver = require("semver");
Agent.prototype.satisfies = function satisfies(range) {
  return semver.satisfies((Number(this.major) || 0) + '.' + (Number(this.minor) || 0) + '.' + (Number(this.patch) || 0), range);
};
