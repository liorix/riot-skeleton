/* */ 
var exec = require("child_process").exec,
    path = require("path"),
    assert = require("assert");
suite('kexec');
test('+ kexec() - kexec echovp - two arguments', function(done) {
  var echoFile = path.join(__dirname, './files/echovp.sh');
  exec(echoFile, function(error, stdout, stderr) {
    assert(stdout.trim() === 'hello world');
    assert(stderr.trim() === '');
    assert(error === null);
    done();
  });
});
