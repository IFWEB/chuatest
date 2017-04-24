/*拓展zepto,用于地址选择器
*/
  (function($, undefined) {
    var prefix = '',
      eventPrefix,
      vendors = {
        Webkit: 'webkit',
        Moz: '',
        O: 'o'
      },
      testEl = document.createElement('div'),
      supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
      transform,
      transitionProperty, transitionDuration, transitionTiming, transitionDelay,
      animationName, animationDuration, animationTiming, animationDelay,
      cssReset = {}

    function dasherize(str) {
      return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase()
    }

    function normalizeEvent(name) {
      return eventPrefix ? eventPrefix + name : name.toLowerCase()
    }

    $.each(vendors, function(vendor, event) {
      if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
        prefix = '-' + vendor.toLowerCase() + '-'
        eventPrefix = event
        return false
      }
    })

    transform = prefix + 'transform'
    cssReset[transitionProperty = prefix + 'transition-property'] =
      cssReset[transitionDuration = prefix + 'transition-duration'] =
      cssReset[transitionDelay = prefix + 'transition-delay'] =
      cssReset[transitionTiming = prefix + 'transition-timing-function'] =
      cssReset[animationName = prefix + 'animation-name'] =
      cssReset[animationDuration = prefix + 'animation-duration'] =
      cssReset[animationDelay = prefix + 'animation-delay'] =
      cssReset[animationTiming = prefix + 'animation-timing-function'] = ''

    $.fx = {
      off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
      speeds: {
        _default: 400,
        fast: 200,
        slow: 600
      },
      cssPrefix: prefix,
      transitionEnd: normalizeEvent('TransitionEnd'),
      animationEnd: normalizeEvent('AnimationEnd')
    }

    $.fn.animate = function(properties, duration, ease, callback, delay) {
      if ($.isFunction(duration))
        callback = duration, ease = undefined, duration = undefined
      if ($.isFunction(ease))
        callback = ease, ease = undefined
      if ($.isPlainObject(duration))
        ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
      if (duration) duration = (typeof duration == 'number' ? duration :
        ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
      if (delay) delay = parseFloat(delay) / 1000
      return this.anim(properties, duration, ease, callback, delay)
    }

    $.fn.anim = function(properties, duration, ease, callback, delay) {
      var key, cssValues = {},
        cssProperties, transforms = '',
        that = this,
        wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false

      if (duration === undefined) duration = $.fx.speeds._default / 1000
      if (delay === undefined) delay = 0
      if ($.fx.off) duration = 0

      if (typeof properties == 'string') {
        // keyframe animation
        cssValues[animationName] = properties
        cssValues[animationDuration] = duration + 's'
        cssValues[animationDelay] = delay + 's'
        cssValues[animationTiming] = (ease || 'linear')
        endEvent = $.fx.animationEnd
      } else {
        cssProperties = []
        // CSS transitions
        for (key in properties)
          if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
          else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

        if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
        if (duration > 0 && typeof properties === 'object') {
          cssValues[transitionProperty] = cssProperties.join(', ')
          cssValues[transitionDuration] = duration + 's'
          cssValues[transitionDelay] = delay + 's'
          cssValues[transitionTiming] = (ease || 'linear')
        }
      }

      wrappedCallback = function(event) {
        if (typeof event !== 'undefined') {
          if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
          $(event.target).unbind(endEvent, wrappedCallback)
        } else
          $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout

        fired = true
        $(this).css(cssReset)
        callback && callback.call(this)
      }
      if (duration > 0) {
        this.bind(endEvent, wrappedCallback)
        // transitionEnd is not always firing on older Android phones
        // so make sure it gets fired
        setTimeout(function() {
          if (fired) return
          wrappedCallback.call(that)
        }, ((duration + delay) * 1000) + 25)
      }

      // trigger page reflow so new elements can animate
      this.size() && this.get(0).clientLeft

      this.css(cssValues)

      if (duration <= 0) setTimeout(function() {
        that.each(function() {
          wrappedCallback.call(this)
        })
      }, 0)

      return this
    }

    testEl = null
  })(Zepto)

  ;
  (function($) {
    var data = {},
      dataAttr = $.fn.data,
      camelize = $.camelCase,
      exp = $.expando = 'Zepto' + (+new Date()),
      emptyArray = []

    // Get value from node:
    // 1. first try key as given,
    // 2. then try camelized key,
    // 3. fall back to reading "data-*" attribute.
    function getData(node, name) {
      var id = node[exp],
        store = id && data[id]
      if (name === undefined) return store || setData(node)
      else {
        if (store) {
          if (name in store) return store[name]
          var camelName = camelize(name)
          if (camelName in store) return store[camelName]
        }
        return dataAttr.call($(node), name)
      }
    }

    // Store value under camelized key on node
    function setData(node, name, value) {
      var id = node[exp] || (node[exp] = ++$.uuid),
        store = data[id] || (data[id] = attributeData(node))
      if (name !== undefined) store[camelize(name)] = value
      return store
    }

    // Read all "data-*" attributes from a node
    function attributeData(node) {
      var store = {}
      $.each(node.attributes || emptyArray, function(i, attr) {
        if (attr.name.indexOf('data-') == 0)
          store[camelize(attr.name.replace('data-', ''))] =
          $.zepto.deserializeValue(attr.value)
      })
      return store
    }

    $.fn.data = function(name, value) {
      return value === undefined ?
        // set multiple values via object
        $.isPlainObject(name) ?
        this.each(function(i, node) {
          $.each(name, function(key, value) {
            setData(node, key, value)
          })
        }) :
        // get value from first element
        (0 in this ? getData(this[0], name) : undefined) :
        // set value on all elements
        this.each(function() {
          setData(this, name, value)
        })
    }

    $.fn.removeData = function(names) {
      if (typeof names == 'string') names = names.split(/\s+/)
      return this.each(function() {
        var id = this[exp],
          store = id && data[id]
        if (store) $.each(names || store, function(key) {
          delete store[names ? camelize(this) : key]
        })
      })
    }

    // Generate extended `remove` and `empty` functions
    ;
    ['remove', 'empty'].forEach(function(methodName) {
      var origFn = $.fn[methodName]
      $.fn[methodName] = function() {
        var elements = this.find('*')
        if (methodName === 'remove') elements = elements.add(this)
        elements.removeData()
        return origFn.call(this)
      }
    })
  })(Zepto)

  ;
  (function($) {
    var slice = Array.prototype.slice

    function Deferred(func) {
      var tuples = [
          // action, add listener, listener list, final state
          ["resolve", "done", $.Callbacks({
            once: 1,
            memory: 1
          }), "resolved"],
          ["reject", "fail", $.Callbacks({
            once: 1,
            memory: 1
          }), "rejected"],
          ["notify", "progress", $.Callbacks({
            memory: 1
          })]
        ],
        state = "pending",
        promise = {
          state: function() {
            return state
          },
          always: function() {
            deferred.done(arguments).fail(arguments)
            return this
          },
          then: function( /* fnDone [, fnFailed [, fnProgress]] */ ) {
            var fns = arguments
            return Deferred(function(defer) {
              $.each(tuples, function(i, tuple) {
                var fn = $.isFunction(fns[i]) && fns[i]
                deferred[tuple[1]](function() {
                  var returned = fn && fn.apply(this, arguments)
                  if (returned && $.isFunction(returned.promise)) {
                    returned.promise()
                      .done(defer.resolve)
                      .fail(defer.reject)
                      .progress(defer.notify)
                  } else {
                    var context = this === promise ? defer.promise() : this,
                      values = fn ? [returned] : arguments
                    defer[tuple[0] + "With"](context, values)
                  }
                })
              })
              fns = null
            }).promise()
          },

          promise: function(obj) {
            return obj != null ? $.extend(obj, promise) : promise
          }
        },
        deferred = {}

      $.each(tuples, function(i, tuple) {
        var list = tuple[2],
          stateString = tuple[3]

        promise[tuple[1]] = list.add

        if (stateString) {
          list.add(function() {
            state = stateString
          }, tuples[i ^ 1][2].disable, tuples[2][2].lock)
        }

        deferred[tuple[0]] = function() {
          deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
          return this
        }
        deferred[tuple[0] + "With"] = list.fireWith
      })

      promise.promise(deferred)
      if (func) func.call(deferred, deferred)
      return deferred
    }

    $.when = function(sub) {
      var resolveValues = slice.call(arguments),
        len = resolveValues.length,
        i = 0,
        remain = len !== 1 || (sub && $.isFunction(sub.promise)) ? len : 0,
        deferred = remain === 1 ? sub : Deferred(),
        progressValues, progressContexts, resolveContexts,
        updateFn = function(i, ctx, val) {
          return function(value) {
            ctx[i] = this
            val[i] = arguments.length > 1 ? slice.call(arguments) : value
            if (val === progressValues) {
              deferred.notifyWith(ctx, val)
            } else if (!(--remain)) {
              deferred.resolveWith(ctx, val)
            }
          }
        }

      if (len > 1) {
        progressValues = new Array(len)
        progressContexts = new Array(len)
        resolveContexts = new Array(len)
        for (; i < len; ++i) {
          if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
            resolveValues[i].promise()
              .done(updateFn(i, resolveContexts, resolveValues))
              .fail(deferred.reject)
              .progress(updateFn(i, progressContexts, progressValues))
          } else {
            --remain
          }
        }
      }
      if (!remain) deferred.resolveWith(resolveContexts, resolveValues)
      return deferred.promise()
    }

    $.Deferred = Deferred
  })(Zepto)

  ;
  (function($) {
    // Create a collection of callbacks to be fired in a sequence, with configurable behaviour
    // Option flags:
    //   - once: Callbacks fired at most one time.
    //   - memory: Remember the most recent context and arguments
    //   - stopOnFalse: Cease iterating over callback list
    //   - unique: Permit adding at most one instance of the same callback
    $.Callbacks = function(options) {
      options = $.extend({}, options)

      var memory, // Last fire value (for non-forgettable lists)
        fired, // Flag to know if list was already fired
        firing, // Flag to know if list is currently firing
        firingStart, // First callback to fire (used internally by add and fireWith)
        firingLength, // End of the loop when firing
        firingIndex, // Index of currently firing callback (modified by remove if needed)
        list = [], // Actual callback list
        stack = !options.once && [], // Stack of fire calls for repeatable lists
        fire = function(data) {
          memory = options.memory && data
          fired = true
          firingIndex = firingStart || 0
          firingStart = 0
          firingLength = list.length
          firing = true
          for (; list && firingIndex < firingLength; ++firingIndex) {
            if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
              memory = false
              break
            }
          }
          firing = false
          if (list) {
            if (stack) stack.length && fire(stack.shift())
            else if (memory) list.length = 0
            else Callbacks.disable()
          }
        },

        Callbacks = {
          add: function() {
            if (list) {
              var start = list.length,
                add = function(args) {
                  $.each(args, function(_, arg) {
                    if (typeof arg === "function") {
                      if (!options.unique || !Callbacks.has(arg)) list.push(arg)
                    } else if (arg && arg.length && typeof arg !== 'string') add(arg)
                  })
                }
              add(arguments)
              if (firing) firingLength = list.length
              else if (memory) {
                firingStart = start
                fire(memory)
              }
            }
            return this
          },
          remove: function() {
            if (list) {
              $.each(arguments, function(_, arg) {
                var index
                while ((index = $.inArray(arg, list, index)) > -1) {
                  list.splice(index, 1)
                  // Handle firing indexes
                  if (firing) {
                    if (index <= firingLength)--firingLength
                    if (index <= firingIndex)--firingIndex
                  }
                }
              })
            }
            return this
          },
          has: function(fn) {
            return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
          },
          empty: function() {
            firingLength = list.length = 0
            return this
          },
          disable: function() {
            list = stack = memory = undefined
            return this
          },
          disabled: function() {
            return !list
          },
          lock: function() {
            stack = undefined;
            if (!memory) Callbacks.disable()
            return this
          },
          locked: function() {
            return !stack
          },
          fireWith: function(context, args) {
            if (list && (!fired || stack)) {
              args = args || []
              args = [context, args.slice ? args.slice() : args]
              if (firing) stack.push(args)
              else fire(args)
            }
            return this
          },
          fire: function() {
            return Callbacks.fireWith(this, arguments)
          },
          fired: function() {
            return !!fired
          }
        }

      return Callbacks
    }
  })(Zepto)

  ;
  (function($) {
    var zepto = $.zepto,
      oldQsa = zepto.qsa,
      oldMatches = zepto.matches

    function visible(elem) {
      elem = $(elem)
      return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
    }

    // Implements a subset from:
    // http://api.jquery.com/category/selectors/jquery-selector-extensions/
    //
    // Each filter function receives the current index, all nodes in the
    // considered set, and a value if there were parentheses. The value
    // of `this` is the node currently being considered. The function returns the
    // resulting node(s), null, or undefined.
    //
    // Complex selectors are not supported:
    //   li:has(label:contains("foo")) + li:has(label:contains("bar"))
    //   ul.inner:first > li
    var filters = $.expr[':'] = {
      visible: function() {
        if (visible(this)) return this
      },
      hidden: function() {
        if (!visible(this)) return this
      },
      selected: function() {
        if (this.selected) return this
      },
      checked: function() {
        if (this.checked) return this
      },
      parent: function() {
        return this.parentNode
      },
      first: function(idx) {
        if (idx === 0) return this
      },
      last: function(idx, nodes) {
        if (idx === nodes.length - 1) return this
      },
      eq: function(idx, _, value) {
        if (idx === value) return this
      },
      contains: function(idx, _, text) {
        if ($(this).text().indexOf(text) > -1) return this
      },
      has: function(idx, _, sel) {
        if (zepto.qsa(this, sel).length) return this
      }
    }

    var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe = /^\s*>/,
      classTag = 'Zepto' + (+new Date())

    function process(sel, fn) {
      // quote the hash in `a[href^=#]` expression
      sel = sel.replace(/=#\]/g, '="#"]')
      var filter, arg, match = filterRe.exec(sel)
      if (match && match[2] in filters) {
        filter = filters[match[2]], arg = match[3]
        sel = match[1]
        if (arg) {
          var num = Number(arg)
          if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
          else arg = num
        }
      }
      return fn(sel, filter, arg)
    }

    zepto.qsa = function(node, selector) {
      return process(selector, function(sel, filter, arg) {
        try {
          var taggedParent
          if (!sel && filter) sel = '*'
          else if (childRe.test(sel))
          // support "> *" child queries by tagging the parent node with a
          // unique class and prepending that classname onto the selector
            taggedParent = $(node).addClass(classTag), sel = '.' + classTag + ' ' + sel

          var nodes = oldQsa(node, sel)
        } catch (e) {
          console.error('error performing selector: %o', selector)
          throw e
        } finally {
          if (taggedParent) taggedParent.removeClass(classTag)
        }
        return !filter ? nodes :
          zepto.uniq($.map(nodes, function(n, i) {
            return filter.call(n, i, nodes, arg)
          }))
      })
    }

    zepto.matches = function(node, selector) {
      return process(selector, function(sel, filter, arg) {
        return (!sel || oldMatches(node, sel)) &&
          (!filter || filter.call(node, null, arg) === node)
      })
    }
  })(Zepto)

  ;
  (function($) {
    var touch = {},
      touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
      longTapDelay = 750,
      gesture

    function swipeDirection(x1, x2, y1, y2) {
      return Math.abs(x1 - x2) >=
        Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }

    function longTap() {
      longTapTimeout = null
      if (touch.last) {
        touch.el.trigger('longTap')
        touch = {}
      }
    }

    function cancelLongTap() {
      if (longTapTimeout) clearTimeout(longTapTimeout)
      longTapTimeout = null
    }

    function cancelAll() {
      if (touchTimeout) clearTimeout(touchTimeout)
      if (tapTimeout) clearTimeout(tapTimeout)
      if (swipeTimeout) clearTimeout(swipeTimeout)
      if (longTapTimeout) clearTimeout(longTapTimeout)
      touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
      touch = {}
    }

    function isPrimaryTouch(event) {
      return (event.pointerType == 'touch' ||
        event.pointerType == event.MSPOINTER_TYPE_TOUCH) && event.isPrimary
    }

    function isPointerEventType(e, type) {
      return (e.type == 'pointer' + type ||
        e.type.toLowerCase() == 'mspointer' + type)
    }

    $(document).ready(function() {
      var now, delta, deltaX = 0,
        deltaY = 0,
        firstTouch, _isPointerType

      if ('MSGesture' in window) {
        gesture = new MSGesture()
        gesture.target = document.body
      }

      $(document)
        .bind('MSGestureEnd', function(e) {
          var swipeDirectionFromVelocity =
            e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
          if (swipeDirectionFromVelocity) {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + swipeDirectionFromVelocity)
          }
        })
        .on('touchstart MSPointerDown pointerdown', function(e) {
          if ((_isPointerType = isPointerEventType(e, 'down')) &&
            !isPrimaryTouch(e)) return
          firstTouch = _isPointerType ? e : e.touches[0]
          if (e.touches && e.touches.length === 1 && touch.x2) {
            // Clear out touch movement data if we have it sticking around
            // This can occur if touchcancel doesn't fire due to preventDefault, etc.
            touch.x2 = undefined
            touch.y2 = undefined
          }
          now = Date.now()
          delta = now - (touch.last || now)
          touch.el = $('tagName' in firstTouch.target ?
            firstTouch.target : firstTouch.target.parentNode)
          touchTimeout && clearTimeout(touchTimeout)
          touch.x1 = firstTouch.pageX
          touch.y1 = firstTouch.pageY
          if (delta > 0 && delta <= 250) touch.isDoubleTap = true
          touch.last = now
          longTapTimeout = setTimeout(longTap, longTapDelay)
          // adds the current touch contact for IE gesture recognition
          if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
        })
        .on('touchmove MSPointerMove pointermove', function(e) {
          if ((_isPointerType = isPointerEventType(e, 'move')) &&
            !isPrimaryTouch(e)) return
          firstTouch = _isPointerType ? e : e.touches[0]
          cancelLongTap()
          touch.x2 = firstTouch.pageX
          touch.y2 = firstTouch.pageY

          deltaX += Math.abs(touch.x1 - touch.x2)
          deltaY += Math.abs(touch.y1 - touch.y2)
        })
        .on('touchend MSPointerUp pointerup', function(e) {
          if ((_isPointerType = isPointerEventType(e, 'up')) &&
            !isPrimaryTouch(e)) return
          cancelLongTap()

          // swipe
          if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

            swipeTimeout = setTimeout(function() {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
            touch = {}
          }, 0)

          // normal tap
          else if ('last' in touch)
          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
            if (deltaX < 30 && deltaY < 30) {
              // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
              // ('tap' fires before 'scroll')
              tapTimeout = setTimeout(function() {

                // trigger universal 'tap' with the option to cancelTouch()
                // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                var event = $.Event('tap')
                event.cancelTouch = cancelAll
                touch.el && touch.el.trigger && touch.el.trigger(event)

                // trigger double tap immediately
                if (touch.isDoubleTap) {
                  if (touch.el) touch.el.trigger('doubleTap')
                  touch = {}
                }

                // trigger single tap after 250ms of inactivity
                else {
                  touchTimeout = setTimeout(function() {
                    touchTimeout = null
                    if (touch.el) touch.el.trigger('singleTap')
                    touch = {}
                  }, 250)
                }
              }, 0)
            } else {
              touch = {}
            }
          deltaX = deltaY = 0

        })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel pointercancel', cancelAll)

      // scrolling the window indicates intention of the user
      // to scroll, not tap or swipe, so cancel all ongoing events
      $(window).on('scroll', cancelAll)
    })

    ;
    ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
      'doubleTap', 'tap', 'singleTap', 'longTap'
    ].forEach(function(eventName) {
      $.fn[eventName] = function(callback) {
        return this.on(eventName, callback)
      }
    })
  })(Zepto)