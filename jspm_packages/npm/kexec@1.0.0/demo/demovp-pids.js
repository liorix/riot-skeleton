/* */ 
(function(process) {
  var kexec = require("../index");
  console.log(process.pid + ' - PID before exec');
  kexec('sh', ['-c', 'echo "$$ - PID after exec"']);
})(require("process"));
