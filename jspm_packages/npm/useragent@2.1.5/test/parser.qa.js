/* */ 
var useragent = require("../index"),
    should = require("should"),
    yaml = require("yamlparser"),
    fs = require("fs");
['testcases.yaml', 'static.custom.yaml', 'firefoxes.yaml', 'pgts.yaml'].forEach(function(filename) {
  var testcases = fs.readFileSync(__dirname + '/fixtures/' + filename).toString(),
      parsedyaml = yaml.eval(testcases);
  testcases = parsedyaml.test_cases;
  testcases.forEach(function(test) {
    if (typeof test.user_agent_string !== 'string')
      return ;
    if (test.family.match(/googlebot|avant/i))
      return ;
    var js_ua;
    if (test.js_ua) {
      js_ua = (Function('return ' + test.js_ua)()).js_user_agent_string;
    }
    exports[filename + ': ' + test.user_agent_string] = function() {
      var agent = useragent.parse(test.user_agent_string, js_ua);
      agent.family.should.equal(test.family);
      agent.major.should.equal(typeof test.major == 'string' ? test.major : '0');
      agent.minor.should.equal(typeof test.minor == 'string' ? test.minor : '0');
      agent.patch.should.equal(typeof test.patch == 'string' ? test.patch : '0');
    };
  });
});
