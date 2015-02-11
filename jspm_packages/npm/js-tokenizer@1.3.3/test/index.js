/* */ 
var test = require("tap").test;
var tok = require("../index");
test('tokenize', function(t) {
  function e(input, output, invalid) {
    t.deepEqual(tok(input, true), output);
    if (invalid)
      t.throws(function() {
        tok(input);
      });
  }
  e('function () { }', ['function', ' ', '(', ')', ' ', '{', ' ', '}']);
  e('"hello"', ['"hello"']);
  e("'hello'", ["'hello'"]);
  e('"   "', ['"   "']);
  e('" \\"  "', ['" \\"  "']);
  e('" \\\n  "', ['" \\\n  "']);
  e('" \n  "', ['"', ' \n  ', '"'], true);
  e("'   '", ["'   '"]);
  e("' \\'  '", ["' \\'  '"]);
  e("' \n  '", ["'", " \n  ", "'"], true);
  t.end();
});
