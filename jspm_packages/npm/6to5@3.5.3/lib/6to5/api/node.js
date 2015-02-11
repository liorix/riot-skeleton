/* */ 
"use strict";
var isFunction = require("lodash/lang/isFunction");
var transform = require("../transformation/index");
var util = require("../util");
var fs = require("fs");
exports.version = require("../../../package.json!systemjs-json").version;
exports.runtime = require("../build-runtime");
exports.types = require("../types/index");
exports.register = function(opts) {
  var register = require("./register/browser");
  if (opts != null)
    register(opts);
  return register;
};
exports.polyfill = function() {
  require("../polyfill");
};
exports.canCompile = util.canCompile;
exports._util = util;
exports.transform = transform;
exports.transformFile = function(filename, opts, callback) {
  if (isFunction(opts)) {
    callback = opts;
    opts = {};
  }
  opts.filename = filename;
  fs.readFile(filename, function(err, code) {
    if (err)
      return callback(err);
    var result;
    try {
      result = transform(code, opts);
    } catch (err) {
      return callback(err);
    }
    callback(null, result);
  });
};
exports.transformFileSync = function(filename, opts) {
  opts = opts || {};
  opts.filename = filename;
  return transform(fs.readFileSync(filename), opts);
};
