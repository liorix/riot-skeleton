/* */ 
(function(process) {
  riot._tmpl = (function() {
    var cache = {},
        re_vars = /("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)/gi;
    return function(str, data) {
      return str && (cache[str] = cache[str] || tmpl(str))(data);
    };
    function tmpl(s, p) {
      p = (s || '{}').replace(/\\{/g, '\uFFF0').replace(/\\}/g, '\uFFF1').split(/({[\s\S]*?})/);
      return new Function('d', 'return ' + (!p[0] && !p[2] ? expr(p[1]) : '[' + p.map(function(s, i) {
        return i % 2 ? expr(s, 1) : '"' + s.replace(/\n/g, '\\n').replace(/"/g, '\\"') + '"';
      }).join(',') + '].join("")').replace(/\uFFF0/g, '{').replace(/\uFFF1/g, '}'));
    }
    function expr(s, n) {
      s = s.replace(/\n/g, ' ').replace(/^[{ ]+|[ }]+$|\/\*.+?\*\//g, '');
      return /^\s*[\w-"']+ *:/.test(s) ? '[' + s.replace(/\W*([\w-]+)\W*:([^,]+)/g, function(_, k, v) {
        return v.replace(/\w[^,|& ]*/g, function(v) {
          return wrap(v, n);
        }) + '?"' + k + '":"",';
      }) + '].join(" ")' : wrap(s, n);
    }
    function wrap(s, nonull) {
      return '(function(v){try{v=' + (s.replace(re_vars, function(s, _, v) {
        return v ? 'd.' + v : s;
      }) || 'x') + '}finally{return ' + (nonull ? '!v&&v!==0?"":v' : 'v') + '}}).call(d)';
    }
  })();
})(require("process"));
