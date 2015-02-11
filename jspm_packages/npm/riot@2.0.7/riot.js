/* */ 
"format cjs";
(function(process) {
  ;
  (function() {
    var riot = {version: 'v2.0.7'};
    'use strict';
    riot.observable = function(el) {
      el = el || {};
      var callbacks = {};
      el.on = function(events, fn) {
        if (typeof fn == 'function') {
          events.replace(/\S+/g, function(name, pos) {
            (callbacks[name] = callbacks[name] || []).push(fn);
            fn.typed = pos > 0;
          });
        }
        return el;
      };
      el.off = function(events, fn) {
        if (events == '*')
          callbacks = {};
        else if (fn) {
          var arr = callbacks[events];
          for (var i = 0,
              cb; (cb = arr && arr[i]); ++i) {
            if (cb == fn) {
              arr.splice(i, 1);
              i--;
            }
          }
        } else {
          events.replace(/\S+/g, function(name) {
            callbacks[name] = [];
          });
        }
        return el;
      };
      el.one = function(name, fn) {
        if (fn)
          fn.one = 1;
        return el.on(name, fn);
      };
      el.trigger = function(name) {
        var args = [].slice.call(arguments, 1),
            fns = callbacks[name] || [];
        for (var i = 0,
            fn; (fn = fns[i]); ++i) {
          if (!fn.busy) {
            fn.busy = 1;
            fn.apply(el, fn.typed ? [name].concat(args) : args);
            if (fn.one) {
              fns.splice(i, 1);
              i--;
            } else if (fns[i] !== fn) {
              i--;
            }
            fn.busy = 0;
          }
        }
        return el;
      };
      return el;
    };
    ;
    (function(riot, evt) {
      if (!this.top)
        return ;
      var loc = location,
          fns = riot.observable(),
          current = hash(),
          win = window;
      function hash() {
        return loc.hash.slice(1);
      }
      function parser(path) {
        return path.split('/');
      }
      function emit(path) {
        if (path.type)
          path = hash();
        if (path != current) {
          fns.trigger.apply(null, ['H'].concat(parser(path)));
          current = path;
        }
      }
      var r = riot.route = function(arg) {
        if (arg[0]) {
          loc.hash = arg;
          emit(arg);
        } else {
          fns.on('H', arg);
        }
      };
      r.exec = function(fn) {
        fn.apply(null, parser(hash()));
      };
      r.parser = function(fn) {
        parser = fn;
      };
      win.addEventListener ? win.addEventListener(evt, emit, false) : win.attachEvent('on' + evt, emit);
    })(riot, 'hashchange');
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
    ;
    (function(riot, is_browser) {
      if (!is_browser)
        return ;
      var tmpl = riot._tmpl,
          all_tags = [],
          tag_impl = {},
          doc = document;
      function each(nodes, fn) {
        for (var i = 0; i < (nodes || []).length; i++) {
          if (fn(nodes[i], i) === false)
            i--;
        }
      }
      function extend(obj, from) {
        from && Object.keys(from).map(function(key) {
          obj[key] = from[key];
        });
        return obj;
      }
      function diff(arr1, arr2) {
        return arr1.filter(function(el) {
          return arr2.indexOf(el) < 0;
        });
      }
      function walk(dom, fn) {
        dom = fn(dom) === false ? dom.nextSibling : dom.firstChild;
        while (dom) {
          walk(dom, fn);
          dom = dom.nextSibling;
        }
      }
      function mkdom(tmpl) {
        var tag_name = tmpl.trim().slice(1, 3).toLowerCase(),
            root_tag = /td|th/.test(tag_name) ? 'tr' : tag_name == 'tr' ? 'tbody' : 'div';
        el = doc.createElement(root_tag);
        el.innerHTML = tmpl;
        return el;
      }
      function update(expressions, instance) {
        instance.trigger('update');
        each(expressions, function(expr) {
          var tag = expr.tag,
              dom = expr.dom;
          function remAttr(name) {
            dom.removeAttribute(name);
          }
          if (expr.loop) {
            remAttr('each');
            return loop(expr, instance);
          }
          if (tag)
            return tag.update ? tag.update() : expr.tag = createTag({
              tmpl: tag[0],
              fn: tag[1],
              root: dom,
              parent: instance
            });
          var attr_name = expr.attr,
              value = tmpl(expr.expr, instance);
          if (value == null)
            value = '';
          if (expr.value === value)
            return ;
          expr.value = value;
          if (!attr_name)
            return dom.nodeValue = value;
          if (!value && expr.bool || /obj|func/.test(typeof value))
            remAttr(attr_name);
          if (typeof value == 'function') {
            dom[attr_name] = function(e) {
              e = e || window.event;
              e.which = e.which || e.charCode || e.keyCode;
              e.target = e.target || e.srcElement;
              e.currentTarget = dom;
              e.item = instance.__item || instance;
              if (value.call(instance, e) !== true) {
                e.preventDefault && e.preventDefault();
                e.returnValue = false;
              }
              instance.update();
            };
          } else if (/^(show|hide|if)$/.test(attr_name)) {
            remAttr(attr_name);
            if (attr_name == 'hide')
              value = !value;
            dom.style.display = value ? '' : 'none';
          } else {
            if (expr.bool) {
              dom[attr_name] = value;
              if (!value)
                return ;
              value = attr_name;
            }
            dom.setAttribute(attr_name, value);
          }
        });
        instance.trigger('updated');
      }
      function parse(root) {
        var named_elements = {},
            expressions = [];
        walk(root, function(dom) {
          var type = dom.nodeType,
              value = dom.nodeValue;
          if (type == 3 && dom.parentNode.tagName != 'STYLE') {
            addExpr(dom, value);
          } else if (type == 1) {
            value = dom.getAttribute('each');
            if (value) {
              addExpr(dom, value, {loop: 1});
              return false;
            }
            var tag = tag_impl[dom.tagName.toLowerCase()];
            each(dom.attributes, function(attr) {
              var name = attr.name,
                  value = attr.value;
              if (/^(name|id)$/.test(name))
                named_elements[value] = dom;
              if (!tag) {
                var bool = name.split('__')[1];
                addExpr(dom, value, {
                  attr: bool || name,
                  bool: bool
                });
                if (bool) {
                  dom.removeAttribute(name);
                  return false;
                }
              }
            });
            if (tag)
              addExpr(dom, 0, {tag: tag});
          }
        });
        return {
          expr: expressions,
          elem: named_elements
        };
        function addExpr(dom, value, data) {
          if (value ? value.indexOf('{') >= 0 : data) {
            var expr = {
              dom: dom,
              expr: value
            };
            expressions.push(extend(expr, data || {}));
          }
        }
      }
      function createTag(conf) {
        var opts = conf.opts || {},
            dom = mkdom(conf.tmpl),
            mountNode = conf.root,
            parent = conf.parent,
            ast = parse(dom),
            tag = {
              root: mountNode,
              opts: opts,
              parent: parent,
              __item: conf.item
            },
            attributes = {};
        extend(tag, ast.elem);
        each(mountNode.attributes, function(attr) {
          attributes[attr.name] = attr.value;
        });
        function updateOpts() {
          Object.keys(attributes).map(function(name) {
            var val = opts[name] = tmpl(attributes[name], parent || tag);
            if (typeof val == 'object')
              mountNode.removeAttribute(name);
          });
        }
        updateOpts();
        if (!tag.on) {
          riot.observable(tag);
          delete tag.off;
        }
        if (conf.fn)
          conf.fn.call(tag, opts);
        tag.update = function(data, _system) {
          if (parent && dom && !dom.firstChild) {
            mountNode = parent.root;
            dom = null;
          }
          if (_system || doc.body.contains(mountNode)) {
            extend(tag, data);
            extend(tag, tag.__item);
            updateOpts();
            update(ast.expr, tag);
            !_system && tag.__item && parent.update();
            return true;
          } else {
            tag.trigger('unmount');
          }
        };
        tag.update(0, true);
        while (dom.firstChild) {
          if (conf.before)
            mountNode.insertBefore(dom.firstChild, conf.before);
          else
            mountNode.appendChild(dom.firstChild);
        }
        tag.trigger('mount');
        all_tags.push(tag);
        return tag;
      }
      function loop(expr, instance) {
        if (expr.done)
          return ;
        expr.done = true;
        var dom = expr.dom,
            prev = dom.previousSibling,
            root = dom.parentNode,
            template = dom.outerHTML,
            val = expr.expr,
            els = val.split(/\s+in\s+/),
            rendered = [],
            checksum,
            keys;
        if (els[1]) {
          val = '{ ' + els[1];
          keys = els[0].slice(1).trim().split(/,\s*/);
        }
        instance.one('mount', function() {
          var p = dom.parentNode;
          if (p) {
            root = p;
            root.removeChild(dom);
          }
        });
        function startPos() {
          return Array.prototype.indexOf.call(root.childNodes, prev) + 1;
        }
        instance.on('updated', function() {
          var items = tmpl(val, instance);
          is_array = Array.isArray(items);
          if (is_array)
            items = items.slice(0);
          else {
            if (!items)
              return ;
            var testsum = JSON.stringify(items);
            if (testsum == checksum)
              return ;
            checksum = testsum;
            items = Object.keys(items).map(function(key, i) {
              var item = {};
              item[keys[0]] = key;
              item[keys[1]] = items[key];
              return item;
            });
          }
          diff(rendered, items).map(function(item) {
            var pos = rendered.indexOf(item);
            root.removeChild(root.childNodes[startPos() + pos]);
            rendered.splice(pos, 1);
          });
          diff(items, rendered).map(function(item, i) {
            var pos = items.indexOf(item);
            if (keys && !checksum) {
              var obj = {};
              obj[keys[0]] = item;
              obj[keys[1]] = pos;
              item = obj;
            }
            var tag = createTag({
              before: root.childNodes[startPos() + pos],
              parent: instance,
              tmpl: template,
              item: item,
              root: root
            });
            instance.on('update', function() {
              tag.update(0, true);
            });
          });
          rendered = items;
        });
      }
      riot.tag = function(name, tmpl, fn) {
        fn = fn || noop, tag_impl[name] = [tmpl, fn];
      };
      riot.mountTo = function(node, tagName, opts) {
        var tag = tag_impl[tagName];
        return tag && createTag({
          tmpl: tag[0],
          fn: tag[1],
          root: node,
          opts: opts
        });
      };
      riot.mount = function(selector, opts) {
        if (selector == '*')
          selector = Object.keys(tag_impl).join(', ');
        var instances = [];
        each(doc.querySelectorAll(selector), function(node) {
          if (node.riot)
            return ;
          var tagName = node.tagName.toLowerCase(),
              instance = riot.mountTo(node, tagName, opts);
          if (instance) {
            instances.push(instance);
            node.riot = 1;
          }
        });
        return instances;
      };
      riot.update = function() {
        return all_tags = all_tags.filter(function(tag) {
          return !!tag.update();
        });
      };
    })(riot, this.top);
    if (typeof exports === 'object')
      module.exports = riot;
    else if (typeof define === 'function' && define.amd)
      define(function() {
        return riot;
      });
    else
      this.riot = riot;
  })();
})(require("process"));
