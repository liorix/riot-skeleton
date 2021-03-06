/* */ 
(function(process) {
  "use strict";
  var Module = require("module");
  var fs = require("fs");
  var FILENAME = ".roadrunner.json";
  var data = {};
  var wrap = function(fn) {
    return function(filename) {
      filename = filename || FILENAME;
      return fn(filename);
    };
  };
  exports.save = wrap(function(filename) {
    exports.set('realpath', Module._realpathCache);
    exports.set('path', Module._pathCache);
    fs.writeFileSync(filename, JSON.stringify(data, null, "  "));
  });
  exports.load = wrap(function(filename) {
    if (!fs.existsSync(filename))
      return ;
    try {
      data = JSON.parse(fs.readFileSync(filename));
    } catch (err) {
      return ;
    }
    Module._pathCache = exports.get('path');
    Module._realpathCache = exports.get('realpath');
  });
  exports.setup = function() {
    process.on("exit", exports.save);
    var sigint = function() {
      process.removeListener("SIGINT", sigint);
      exports.save();
      process.kill(process.pid, "SIGINT");
    };
    process.on("SIGINT", sigint);
  };
  exports.get = function(key) {
    return data[key] = data[key] || {};
  };
  exports.set = function(key, val) {
    return data[key] = val;
  };
})(require("process"));
