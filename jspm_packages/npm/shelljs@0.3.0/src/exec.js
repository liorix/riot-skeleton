/* */ 
(function(process) {
  var common = require("./common");
  var _tempDir = require("./tempdir");
  var _pwd = require("./pwd");
  var path = require("path");
  var fs = require("fs");
  var child = require("child_process");
  function execSync(cmd, opts) {
    var tempDir = _tempDir();
    var stdoutFile = path.resolve(tempDir + '/' + common.randomFileName()),
        codeFile = path.resolve(tempDir + '/' + common.randomFileName()),
        scriptFile = path.resolve(tempDir + '/' + common.randomFileName()),
        sleepFile = path.resolve(tempDir + '/' + common.randomFileName());
    var options = common.extend({silent: common.config.silent}, opts);
    var previousStdoutContent = '';
    function updateStdout() {
      if (options.silent || !fs.existsSync(stdoutFile))
        return ;
      var stdoutContent = fs.readFileSync(stdoutFile, 'utf8');
      if (stdoutContent.length <= previousStdoutContent.length)
        return ;
      process.stdout.write(stdoutContent.substr(previousStdoutContent.length));
      previousStdoutContent = stdoutContent;
    }
    function escape(str) {
      return (str + '').replace(/([\\"'])/g, "\\$1").replace(/\0/g, "\\0");
    }
    cmd += ' > ' + stdoutFile + ' 2>&1';
    var script = "var child = require('child_process')," + "     fs = require('fs');" + "child.exec('" + escape(cmd) + "', {env: process.env, maxBuffer: 20*1024*1024}, function(err) {" + "  fs.writeFileSync('" + escape(codeFile) + "', err ? err.code.toString() : '0');" + "});";
    if (fs.existsSync(scriptFile))
      common.unlinkSync(scriptFile);
    if (fs.existsSync(stdoutFile))
      common.unlinkSync(stdoutFile);
    if (fs.existsSync(codeFile))
      common.unlinkSync(codeFile);
    fs.writeFileSync(scriptFile, script);
    child.exec('"' + process.execPath + '" ' + scriptFile, {
      env: process.env,
      cwd: _pwd(),
      maxBuffer: 20 * 1024 * 1024
    });
    while (!fs.existsSync(codeFile)) {
      updateStdout();
      fs.writeFileSync(sleepFile, 'a');
    }
    while (!fs.existsSync(stdoutFile)) {
      updateStdout();
      fs.writeFileSync(sleepFile, 'a');
    }
    var code = parseInt('', 10);
    while (isNaN(code)) {
      code = parseInt(fs.readFileSync(codeFile, 'utf8'), 10);
    }
    var stdout = fs.readFileSync(stdoutFile, 'utf8');
    try {
      common.unlinkSync(scriptFile);
    } catch (e) {}
    try {
      common.unlinkSync(stdoutFile);
    } catch (e) {}
    try {
      common.unlinkSync(codeFile);
    } catch (e) {}
    try {
      common.unlinkSync(sleepFile);
    } catch (e) {}
    if (code === 1 || code === 2 || code >= 126) {
      common.error('', true);
    }
    var obj = {
      code: code,
      output: stdout
    };
    return obj;
  }
  function execAsync(cmd, opts, callback) {
    var output = '';
    var options = common.extend({silent: common.config.silent}, opts);
    var c = child.exec(cmd, {
      env: process.env,
      maxBuffer: 20 * 1024 * 1024
    }, function(err) {
      if (callback)
        callback(err ? err.code : 0, output);
    });
    c.stdout.on('data', function(data) {
      output += data;
      if (!options.silent)
        process.stdout.write(data);
    });
    c.stderr.on('data', function(data) {
      output += data;
      if (!options.silent)
        process.stdout.write(data);
    });
    return c;
  }
  function _exec(command, options, callback) {
    if (!command)
      common.error('must specify command');
    if (typeof options === 'function') {
      callback = options;
      options = {async: true};
    }
    if (typeof options === 'object' && typeof callback === 'function') {
      options.async = true;
    }
    options = common.extend({
      silent: common.config.silent,
      async: false
    }, options);
    if (options.async)
      return execAsync(command, options, callback);
    else
      return execSync(command, options);
  }
  module.exports = _exec;
})(require("process"));
