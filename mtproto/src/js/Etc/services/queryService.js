function queryServiceModule() {
  var arr = [];
  var document = window.document;
  var getProto = Object.getPrototypeOf;
  var slice = arr.slice;
  var concat = arr.concat;
  var push = arr.push;
  var indexOf = arr.indexOf;
  var class2type = {};
  var toString = class2type.toString;
  var hasOwn = class2type.hasOwnProperty;
  var fnToString = hasOwn.toString;
  var ObjectFunctionString = fnToString.call(Object);
  var support = {};

  function isFunction(obj) {
    return typeof obj === 'function' && typeof obj.nodeType !== 'number';
  }

  function inArray( elem, arr, i ) {
    return arr == null ? -1 : indexOf.call( arr, elem, i );
  }

  var isWindow = function isWindow(obj) {
    return obj != null && obj === obj.window;
  };

  var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );

  function createOptions( options ) {
    var object = {};
    each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
      object[ flag ] = true;
    } );
    return object;
  }

  var preservedScriptAttributes = {
    type: true,
    src: true,
    nonce: true,
    noModule: true,
  };

  function DOMEval(code, node, doc) {
    doc = doc || document;
    var i, val,
      script = doc.createElement('script');
    script.text = code;
    if (node) {
      for (i in preservedScriptAttributes) {
        val = node[i] || node.getAttribute && node.getAttribute(i);
        if (val) {
          script.setAttribute(i, val);
        }
      }
    }
    doc.head.appendChild(script).parentNode.removeChild(script);
  }


  function toType(obj) {
    if (obj == null) {
      return obj + '';
    }
    return typeof obj === 'object' || typeof obj === 'function' ?
      class2type[toString.call(obj)] || 'object' :
      typeof obj;
  }

  function isPlainObject(obj) {
    var proto, Ctor;
    if (!obj || toString.call(obj) !== '[object Object]') {
      return false;
    }
    proto = getProto(obj);
    if (!proto) {
      return true;
    }
    Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
  }

  function extend() {
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    if (typeof target === 'boolean') {
      deep = target;
      target = arguments[i] || {};
      i++;
    }
    if (typeof target !== 'object' && !isFunction(target)) {
      target = {};
    }
    if (i === length) {
      target = this;
      i--;
    }
    for (; i < length; i++) {
      if ((options = arguments[i]) != null) {
        for (name in options) {
          copy = options[name];
          if (name === '__proto__' || target === copy) {
            continue;
          }
          if (deep && copy && (isPlainObject(copy) ||
            (copyIsArray = Array.isArray(copy)))) {
            src = target[name];
            if (copyIsArray && !Array.isArray(src)) {
              clone = [];
            } else if (!copyIsArray && !isPlainObject(src)) {
              clone = {};
            } else {
              clone = src;
            }
            copyIsArray = false;
            target[name] = extend(deep, clone, copy);
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    return target;
  };

  function isArrayLike( obj ) {
    var length = !!obj && "length" in obj && obj.length,
      type = toType( obj );
    if ( isFunction( obj ) || isWindow( obj ) ) {
      return false;
    }
    return type === "array" || length === 0 ||
      typeof length === "number" && length > 0 && ( length - 1 ) in obj;
  }

  function each(obj, callback) {
    var length, i = 0;

    if (isArrayLike(obj)) {
      length = obj.length;
      for (; i < length; i++) {
        if (callback.call(obj[i], i, obj[i]) === false) {
          break;
        }
      }
    } else {
      for (i in obj) {
        if (callback.call(obj[i], i, obj[i]) === false) {
          break;
        }
      }
    }

    return obj;
  }

  function Callbacks(options) {
    options = typeof options === 'string' ?
      createOptions(options) :
      extend({}, options);

    var firing,
      memory,
      fired,
      locked,
      list = [],
      queue = [],
      firingIndex = -1,
      fire = function () {
        locked = locked || options.once;
        fired = firing = true;
        for (; queue.length; firingIndex = -1) {
          memory = queue.shift();
          while (++firingIndex < list.length) {
            if (list[firingIndex].apply(memory[0], memory[1]) === false &&
              options.stopOnFalse) {
              firingIndex = list.length;
              memory = false;
            }
          }
        }
        if (!options.memory) {
          memory = false;
        }
        firing = false;
        if (locked) {
          if (memory) {
            list = [];
          } else {
            list = '';
          }
        }
      },
      self = {
        add: function () {
          if (list) {
            if (memory && !firing) {
              firingIndex = list.length - 1;
              queue.push(memory);
            }
            (function add(args) {
              each(args, function (_, arg) {
                if (isFunction(arg)) {
                  if (!options.unique || !self.has(arg)) {
                    list.push(arg);
                  }
                } else if (arg && arg.length && toType(arg) !== 'string') {
                  add(arg);
                }
              });
            })(arguments);

            if (memory && !firing) {
              fire();
            }
          }
          return this;
        },
        remove: function () {
          each(arguments, function (_, arg) {
            var index;
            while ((index = inArray(arg, list, index)) > -1) {
              list.splice(index, 1);
              if (index <= firingIndex) {
                firingIndex--;
              }
            }
          });
          return this;
        },
        has: function (fn) {
          return fn ?
            inArray(fn, list) > -1 :
            list.length > 0;
        },
        empty: function () {
          if (list) {
            list = [];
          }
          return this;
        },
        disable: function () {
          locked = queue = [];
          list = memory = '';
          return this;
        },
        disabled: function () {
          return !list;
        },
        lock: function () {
          locked = queue = [];
          if (!memory && !firing) {
            list = memory = '';
          }
          return this;
        },
        locked: function () {
          return !!locked;
        },
        fireWith: function (context, args) {
          if (!locked) {
            args = args || [];
            args = [context, args.slice ? args.slice() : args];
            queue.push(args);
            if (!firing) {
              fire();
            }
          }
          return this;
        },
        fire: function () {
          self.fireWith(this, arguments);
          return this;
        },
        fired: function () {
          return !!fired;
        },
      };

    return self;
  };


  function Identity(v) {
    return v;
  }

  function Thrower(ex) {
    throw ex;
  }

  function adoptValue(value, resolve, reject, noValue) {
    var method;
    try {
      if (value && isFunction((method = value.promise))) {
        method.call(value).done(resolve).fail(reject);
      } else if (value && isFunction((method = value.then))) {
        method.call(value, resolve, reject);
      } else {
        resolve.apply(undefined, [value].slice(noValue));
      }
    } catch (value) {
      reject.apply(undefined, [value]);
    }
  }

  function Deferred(func) {
    var tuples = [
        ['notify', 'progress', Callbacks('memory'),
          Callbacks('memory'), 2],
        ['resolve', 'done', Callbacks('once memory'),
          Callbacks('once memory'), 0, 'resolved'],
        ['reject', 'fail', Callbacks('once memory'),
          Callbacks('once memory'), 1, 'rejected'],
      ],
      state = 'pending',
      promise = {
        state: function () {
          return state;
        },
        always: function () {
          deferred.done(arguments).fail(arguments);
          return this;
        },
        'catch': function (fn) {
          return promise.then(null, fn);
        },
        pipe: function () {
          var fns = arguments;
          return Deferred(function (newDefer) {
            each(tuples, function (i, tuple) {
              var fn = isFunction(fns[tuple[4]]) && fns[tuple[4]];
              deferred[tuple[1]](function () {
                var returned = fn && fn.apply(this, arguments);
                if (returned && isFunction(returned.promise)) {
                  returned.promise()
                    .progress(newDefer.notify)
                    .done(newDefer.resolve)
                    .fail(newDefer.reject);
                } else {
                  newDefer[tuple[0] + 'With'](
                    this,
                    fn ? [returned] : arguments,
                  );
                }
              });
            });
            fns = null;
          }).promise();
        },
        then: function (onFulfilled, onRejected, onProgress) {
          var maxDepth = 0;

          function resolve(depth, deferred, handler, special) {
            return function () {
              var that = this,
                args = arguments,
                mightThrow = function () {
                  var returned, then;
                  if (depth < maxDepth) {
                    return;
                  }
                  returned = handler.apply(that, args);
                  if (returned === deferred.promise()) {
                    throw new TypeError('Thenable self-resolution');
                  }
                  then = returned &&
                    (typeof returned === 'object' ||
                      typeof returned === 'function') &&
                    returned.then;

                  if (isFunction(then)) {
                    if (special) {
                      then.call(
                        returned,
                        resolve(maxDepth, deferred, Identity, special),
                        resolve(maxDepth, deferred, Thrower, special),
                      );
                    } else {

                      maxDepth++;

                      then.call(
                        returned,
                        resolve(maxDepth, deferred, Identity, special),
                        resolve(maxDepth, deferred, Thrower, special),
                        resolve(maxDepth, deferred, Identity,
                          deferred.notifyWith),
                      );
                    }
                  } else {
                    if (handler !== Identity) {
                      that = undefined;
                      args = [returned];
                    }
                    (special || deferred.resolveWith)(that, args);
                  }
                },
                process = special ?
                  mightThrow :
                  function () {
                    try {
                      mightThrow();
                    } catch (e) {
                      if (depth + 1 >= maxDepth) {
                        if (handler !== Thrower) {
                          that = undefined;
                          args = [e];
                        }
                        deferred.rejectWith(that, args);
                      }
                    }
                  };
              if (depth) {
                process();
              } else {
                window.setTimeout(process);
              }
            };
          }

          return Deferred(function (newDefer) {
            tuples[0][3].add(
              resolve(
                0,
                newDefer,
                isFunction(onProgress) ?
                  onProgress :
                  Identity,
                newDefer.notifyWith,
              ),
            );
            tuples[1][3].add(
              resolve(
                0,
                newDefer,
                isFunction(onFulfilled) ?
                  onFulfilled :
                  Identity,
              ),
            );
            tuples[2][3].add(
              resolve(
                0,
                newDefer,
                isFunction(onRejected) ?
                  onRejected :
                  Thrower,
              ),
            );
          }).promise();
        },
        promise: function (obj) {
          return obj != null ? extend(obj, promise) : promise;
        },
      },
      deferred = {};
    each(tuples, function (i, tuple) {
      var list = tuple[2],
        stateString = tuple[5];
      promise[tuple[1]] = list.add;

      // Handle state
      if (stateString) {
        list.add(
          function () {
            state = stateString;
          },
          tuples[3 - i][2].disable,
          tuples[3 - i][3].disable,
          tuples[0][2].lock,
          tuples[0][3].lock,
        );
      }
      list.add(tuple[3].fire);
      deferred[tuple[0]] = function () {
        deferred[tuple[0] + 'With'](this === deferred ? undefined : this, arguments);
        return this;
      };
      deferred[tuple[0] + 'With'] = list.fireWith;
    });
    promise.promise(deferred);
    if (func) {
      func.call(deferred, deferred);
    }
    return deferred;
  }

  function when(singleValue) {
    var remaining = arguments.length,
      i = remaining,
      resolveContexts = Array(i),
      resolveValues = slice.call(arguments),
      master = Deferred(),
      updateFunc = function (i) {
        return function (value) {
          resolveContexts[i] = this;
          resolveValues[i] = arguments.length > 1 ? slice.call(arguments) : value;
          if (!(--remaining)) {
            master.resolveWith(resolveContexts, resolveValues);
          }
        };
      };
    if (remaining <= 1) {
      adoptValue(singleValue, master.done(updateFunc(i)).resolve, master.reject,
        !remaining);

      // Use .then() to unwrap secondary thenables (cf. gh-3000)
      if (master.state() === 'pending' ||
        isFunction(resolveValues[i] && resolveValues[i].then)) {
        return master.then();
      }
    }
    while (i--) {
      adoptValue(resolveValues[i], updateFunc(i), master.reject);
    }

    return master.promise();
  }

  return {
    defer: function () {
      var deferred = Deferred();
      deferred.promise = deferred.promise();
      return deferred;
    },
    when: when,
    reject: function (result) {
      return this.defer().reject(result);
    },
    all: function (promises) {
      if (isArray(promises)) {
        return this.when.apply(null, promises);
      }

      var p = [];
      var keys = Object.keys(promises);

      forEach(keys, function (key) {
        p.push(promises[key]);
      });

      return this.all(p).then(function () {
        var objects = toArray(arguments);
        var result = {};

        forEach(keys, function (key, i) {
          result[key] = objects[i];
        });

        return result;
      });
    },
  };
}

queryServiceModule.dependencies = [];
