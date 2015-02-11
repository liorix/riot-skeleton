/* */ 
'use strict';
var path = require("path"),
    fs = require("fs"),
    vm = require("vm");
var request = require("request"),
    yaml = require("yamlparser");
exports.update = function update(callback) {
  fs.readFile(exports.before, 'utf8', function reading(err, before) {
    if (err)
      return callback(err);
    request(exports.remote, function downloading(err, res, remote) {
      if (err)
        return callback(err);
      if (res.statusCode !== 200)
        return callback(new Error('Invalid statusCode returned'));
      fs.readFile(exports.after, 'utf8', function reading(err, after) {
        if (err)
          return callback(err);
        exports.parse([before, remote, after], function parsing(err, results, source) {
          callback(err, results);
          if (source && !err) {
            fs.writeFile(exports.output, source, function idk(err) {
              if (err) {
                console.error('Failed to save the generated file due to reasons', err);
              }
            });
          }
        });
      });
    });
  });
};
exports.parse = function parse(sources, callback) {
  var results = {};
  var data = sources.reduce(function parser(memo, data) {
    data = data.replace(/os_v([1-3])_replacement/gim, function replace(match, version) {
      return 'v' + version + '_replacement';
    });
    try {
      data = yaml.eval(data);
    } catch (e) {
      callback(e);
      callback = null;
      return memo;
    }
    Object.keys(data).forEach(function(key) {
      var results = data[key];
      memo[key] = memo[key] || [];
      for (var i = 0,
          l = results.length; i < l; i++) {
        memo[key].push(results[i]);
      }
    });
    return memo;
  }, {});
  [{
    resource: 'user_agent_parsers',
    replacement: 'family_replacement',
    name: 'browser'
  }, {
    resource: 'device_parsers',
    replacement: 'device_replacement',
    name: 'device'
  }, {
    resource: 'os_parsers',
    replacement: 'os_replacement',
    name: 'os'
  }].forEach(function parsing(details) {
    results[details.resource] = results[details.resource] || [];
    var resources = data[details.resource],
        name = details.resource.replace('_parsers', ''),
        resource,
        parser;
    for (var i = 0,
        l = resources.length; i < l; i++) {
      resource = resources[i];
      parser = 'parser = Object.create(null);\n';
      parser += 'parser[0] = new RegExp(' + JSON.stringify(resource.regex) + ');\n';
      if (resource[details.replacement]) {
        parser += 'parser[1] = "' + resource[details.replacement].replace('"', '\\"') + '";';
      } else {
        parser += 'parser[1] = 0;';
      }
      parser += '\n';
      if (resource.v1_replacement) {
        parser += 'parser[2] = "' + resource.v1_replacement.replace('"', '\\"') + '";';
      } else {
        parser += 'parser[2] = 0;';
      }
      parser += '\n';
      if (resource.v2_replacement) {
        parser += 'parser[3] = "' + resource.v2_replacement.replace('"', '\\"') + '";';
      } else {
        parser += 'parser[3] = 0;';
      }
      parser += '\n';
      if (resource.v3_replacement) {
        parser += 'parser[4] = "' + resource.v3_replacement.replace('"', '\\"') + '";';
      } else {
        parser += 'parser[4] = 0;';
      }
      parser += '\n';
      parser += 'exports.' + details.name + '[' + i + '] = parser;';
      results[details.resource].push(parser);
    }
  });
  exports.generate(results, callback);
};
exports.generate = function generate(results, callback) {
  var regexps = ['"use strict";', exports.LEADER, 'var parser;', 'exports.browser = Object.create(null);', results.user_agent_parsers.join('\n'), 'exports.browser.length = ' + results.user_agent_parsers.length + ';', 'exports.device = Object.create(null);', results.device_parsers.join('\n'), 'exports.device.length = ' + results.device_parsers.length + ';', 'exports.os = Object.create(null);', results.os_parsers.join('\n'), 'exports.os.length = ' + results.os_parsers.length + ';'].join('\n\n');
  var sandbox = {exports: {}};
  try {
    vm.runInNewContext(regexps, sandbox, 'validating.vm');
  } catch (e) {
    return callback(e, null, regexps);
  }
  callback(undefined, sandbox.exports, regexps);
};
exports.remote = 'https://raw.githubusercontent.com/ua-parser/uap-core/master/regexes.yaml';
exports.before = path.resolve(__dirname, '..', 'static', 'user_agent.before.yaml');
exports.after = path.resolve(__dirname, '..', 'static', 'user_agent.after.yaml');
exports.output = path.resolve(__dirname, '..', 'lib', 'regexps.js');
exports.LEADER = fs.readFileSync(path.join(__dirname, 'donotedit'), 'UTF-8');
