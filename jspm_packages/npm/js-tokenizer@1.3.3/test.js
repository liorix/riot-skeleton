/* */ 
(function(process) {
  var fs = require("fs");
  var tok = require("./index");
  var src = fs.readFileSync(process.argv[2], 'utf-8');
  console.log(tok(src).map(function(e) {
    return [tok.type(e), e];
  }));
})(require("process"));
