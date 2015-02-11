/* */ 
'use strict';
var regexps = require("./lib/regexps");
var osparsers = regexps.os,
    osparserslength = osparsers.length;
var agentparsers = regexps.browser,
    agentparserslength = agentparsers.length;
var deviceparsers = regexps.device,
    deviceparserslength = deviceparsers.length;
function Agent(family, major, minor, patch, source) {
  this.family = family || 'Other';
  this.major = major || '0';
  this.minor = minor || '0';
  this.patch = patch || '0';
  this.source = source || '';
}
Object.defineProperty(Agent.prototype, 'os', {
  get: function lazyparse() {
    var userAgent = this.source,
        length = osparserslength,
        parsers = osparsers,
        i = 0,
        parser,
        res;
    for (; i < length; i++) {
      if (res = parsers[i][0].exec(userAgent)) {
        parser = parsers[i];
        if (parser[1])
          res[1] = parser[1].replace('$1', res[1]);
        break;
      }
    }
    return Object.defineProperty(this, 'os', {value: !parser || !res ? new OperatingSystem() : new OperatingSystem(res[1], parser[2] || res[2], parser[3] || res[3], parser[4] || res[4])}).os;
  },
  set: function set(os) {
    if (!(os instanceof OperatingSystem))
      return false;
    return Object.defineProperty(this, 'os', {value: os}).os;
  }
});
Object.defineProperty(Agent.prototype, 'device', {
  get: function lazyparse() {
    var userAgent = this.source,
        length = deviceparserslength,
        parsers = deviceparsers,
        i = 0,
        parser,
        res;
    for (; i < length; i++) {
      if (res = parsers[i][0].exec(userAgent)) {
        parser = parsers[i];
        if (parser[1])
          res[1] = parser[1].replace('$1', res[1]);
        break;
      }
    }
    return Object.defineProperty(this, 'device', {value: !parser || !res ? new Device() : new Device(res[1], parser[2] || res[2], parser[3] || res[3], parser[4] || res[4])}).device;
  },
  set: function set(device) {
    if (!(device instanceof Device))
      return false;
    return Object.defineProperty(this, 'device', {value: device}).device;
  }
});
Agent.prototype.toAgent = function toAgent() {
  var output = this.family,
      version = this.toVersion();
  if (version)
    output += ' ' + version;
  return output;
};
Agent.prototype.toString = function toString() {
  var agent = this.toAgent(),
      os = this.os !== 'Other' ? this.os : false;
  return agent + (os ? ' / ' + os : '');
};
Agent.prototype.toVersion = function toVersion() {
  var version = '';
  if (this.major) {
    version += this.major;
    if (this.minor) {
      version += '.' + this.minor;
      if (this.patch) {
        version += (isNaN(+this.patch) ? ' ' : '.') + this.patch;
      }
    }
  }
  return version;
};
Agent.prototype.toJSON = function toJSON() {
  return {
    family: this.family,
    major: this.major,
    minor: this.minor,
    patch: this.patch,
    device: this.device,
    os: this.os
  };
};
function OperatingSystem(family, major, minor, patch) {
  this.family = family || 'Other';
  this.major = major || '0';
  this.minor = minor || '0';
  this.patch = patch || '0';
}
OperatingSystem.prototype.toString = function toString() {
  var output = this.family,
      version = this.toVersion();
  if (version)
    output += ' ' + version;
  return output;
};
OperatingSystem.prototype.toVersion = function toVersion() {
  var version = '';
  if (this.major) {
    version += this.major;
    if (this.minor) {
      version += '.' + this.minor;
      if (this.patch) {
        version += (isNaN(+this.patch) ? ' ' : '.') + this.patch;
      }
    }
  }
  return version;
};
OperatingSystem.prototype.toJSON = function toJSON() {
  return {
    family: this.family,
    major: this.major || undefined,
    minor: this.minor || undefined,
    patch: this.patch || undefined
  };
};
function Device(family, major, minor, patch) {
  this.family = family || 'Other';
  this.major = major || '0';
  this.minor = minor || '0';
  this.patch = patch || '0';
}
Device.prototype.toString = function toString() {
  var output = this.family,
      version = this.toVersion();
  if (version)
    output += ' ' + version;
  return output;
};
Device.prototype.toVersion = function toVersion() {
  var version = '';
  if (this.major) {
    version += this.major;
    if (this.minor) {
      version += '.' + this.minor;
      if (this.patch) {
        version += (isNaN(+this.patch) ? ' ' : '.') + this.patch;
      }
    }
  }
  return version;
};
Device.prototype.toJSON = function toJSON() {
  return {
    family: this.family,
    major: this.major || undefined,
    minor: this.minor || undefined,
    patch: this.patch || undefined
  };
};
module.exports = function updater() {
  try {
    require("./lib/update").update(function updating(err, results) {
      if (err) {
        console.log('[useragent] Failed to update the parsed due to an error:');
        console.log('[useragent] ' + (err.message ? err.message : err));
        return ;
      }
      regexps = results;
      osparsers = regexps.os;
      osparserslength = osparsers.length;
      agentparsers = regexps.browser;
      agentparserslength = agentparsers.length;
      deviceparsers = regexps.device;
      deviceparserslength = deviceparsers.length;
    });
  } catch (e) {
    console.error('[useragent] If you want to use automatic updating, please add:');
    console.error('[useragent]   - request (npm install request --save)');
    console.error('[useragent]   - yamlparser (npm install yamlparser --save)');
    console.error('[useragent] To your own package.json');
  }
};
exports = module.exports;
exports.Device = Device;
exports.OperatingSystem = OperatingSystem;
exports.Agent = Agent;
exports.parse = function parse(userAgent, jsAgent) {
  if (!userAgent)
    return new Agent();
  var length = agentparserslength,
      parsers = agentparsers,
      i = 0,
      parser,
      res;
  for (; i < length; i++) {
    if (res = parsers[i][0].exec(userAgent)) {
      parser = parsers[i];
      if (parser[1])
        res[1] = parser[1].replace('$1', res[1]);
      if (!jsAgent)
        return new Agent(res[1], parser[2] || res[2], parser[3] || res[3], parser[4] || res[4], userAgent);
      break;
    }
  }
  if (!parser || !res)
    return new Agent('', '', '', '', userAgent);
  if (jsAgent && ~jsAgent.indexOf('Chrome/') && ~userAgent.indexOf('chromeframe')) {
    res[1] = 'Chrome Frame (IE ' + res[1] + '.' + res[2] + ')';
    parser = parse(jsAgent);
    parser[2] = parser.major;
    parser[3] = parser.minor;
    parser[4] = parser.patch;
  }
  return new Agent(res[1], parser[2] || res[2], parser[3] || res[3], parser[4] || res[4], userAgent);
};
var LRU = require("lru-cache")(5000);
exports.lookup = function lookup(userAgent, jsAgent) {
  var key = (userAgent || '') + (jsAgent || ''),
      cached = LRU.get(key);
  if (cached)
    return cached;
  LRU.set(key, (cached = exports.parse(userAgent, jsAgent)));
  return cached;
};
exports.is = function is(useragent) {
  var ua = (useragent || '').toLowerCase(),
      details = {
        chrome: false,
        firefox: false,
        ie: false,
        mobile_safari: false,
        mozilla: false,
        opera: false,
        safari: false,
        webkit: false,
        android: false,
        version: (ua.match(exports.is.versionRE) || [0, "0"])[1]
      };
  if (~ua.indexOf('webkit')) {
    details.webkit = true;
    if (~ua.indexOf('android')) {
      details.android = true;
    }
    if (~ua.indexOf('chrome')) {
      details.chrome = true;
    } else if (~ua.indexOf('safari')) {
      details.safari = true;
      if (~ua.indexOf('mobile') && ~ua.indexOf('apple')) {
        details.mobile_safari = true;
      }
    }
  } else if (~ua.indexOf('opera')) {
    details.opera = true;
  } else if (~ua.indexOf('trident')) {
    details.ie = true;
  } else if (~ua.indexOf('mozilla') && !~ua.indexOf('compatible')) {
    details.mozilla = true;
    if (~ua.indexOf('firefox'))
      details.firefox = true;
  }
  return details;
};
exports.is.versionRE = /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/;
exports.fromJSON = function fromJSON(details) {
  if (typeof details === 'string')
    details = JSON.parse(details);
  var agent = new Agent(details.family, details.major, details.minor, details.patch),
      os = details.os;
  if ('device' in details) {
    agent.device = new Device(details.device.family);
  } else {
    agent.device = new Device();
  }
  if ('os' in details && os) {
    if (typeof os === 'string') {
      agent.os = new OperatingSystem(os);
    } else {
      agent.os = new OperatingSystem(os.family, os.major, os.minor, os.patch);
    }
  }
  return agent;
};
exports.version = require("./package.json!systemjs-json").version;
