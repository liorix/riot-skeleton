/* */ 
"use strict";
module.exports = SourceMap;
var sourceMap = require("source-map");
var t = require("../types/index");
function SourceMap(position, opts, code) {
  this.position = position;
  this.opts = opts;
  if (opts.sourceMap) {
    this.map = new sourceMap.SourceMapGenerator({
      file: opts.sourceMapName,
      sourceRoot: opts.sourceRoot
    });
    this.map.setSourceContent(opts.sourceFileName, code);
  } else {
    this.map = null;
  }
}
SourceMap.prototype.get = function() {
  var map = this.map;
  if (map) {
    return map.toJSON();
  } else {
    return map;
  }
};
SourceMap.prototype.mark = function(node, type) {
  var loc = node.loc;
  if (!loc)
    return ;
  var map = this.map;
  if (!map)
    return ;
  if (t.isProgram(node) || t.isFile(node))
    return ;
  var position = this.position;
  var generated = {
    line: position.line,
    column: position.column
  };
  var original = loc[type];
  map.addMapping({
    source: this.opts.sourceFileName,
    generated: generated,
    original: original
  });
};
