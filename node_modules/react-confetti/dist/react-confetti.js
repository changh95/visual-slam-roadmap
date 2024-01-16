(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"));
	else if(typeof define === 'function' && define.amd)
		define(["react"], factory);
	else if(typeof exports === 'object')
		exports["ReactConfetti"] = factory(require("react"));
	else
		root["ReactConfetti"] = factory(root["React"]);
})(typeof self !== "undefined" ? self : this, function(__WEBPACK_EXTERNAL_MODULE_react__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/tween-functions/index.js":
/*!***********************************************!*\
  !*** ./node_modules/tween-functions/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// t: current time, b: beginning value, _c: final value, d: total duration
var tweenFunctions = {
  linear: function(t, b, _c, d) {
    var c = _c - b;
    return c * t / d + b;
  },
  easeInQuad: function(t, b, _c, d) {
    var c = _c - b;
    return c * (t /= d) * t + b;
  },
  easeOutQuad: function(t, b, _c, d) {
    var c = _c - b;
    return -c * (t /= d) * (t - 2) + b;
  },
  easeInOutQuad: function(t, b, _c, d) {
    var c = _c - b;
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t + b;
    } else {
      return -c / 2 * ((--t) * (t - 2) - 1) + b;
    }
  },
  easeInCubic: function(t, b, _c, d) {
    var c = _c - b;
    return c * (t /= d) * t * t + b;
  },
  easeOutCubic: function(t, b, _c, d) {
    var c = _c - b;
    return c * ((t = t / d - 1) * t * t + 1) + b;
  },
  easeInOutCubic: function(t, b, _c, d) {
    var c = _c - b;
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t + b;
    } else {
      return c / 2 * ((t -= 2) * t * t + 2) + b;
    }
  },
  easeInQuart: function(t, b, _c, d) {
    var c = _c - b;
    return c * (t /= d) * t * t * t + b;
  },
  easeOutQuart: function(t, b, _c, d) {
    var c = _c - b;
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  },
  easeInOutQuart: function(t, b, _c, d) {
    var c = _c - b;
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t * t + b;
    } else {
      return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
  },
  easeInQuint: function(t, b, _c, d) {
    var c = _c - b;
    return c * (t /= d) * t * t * t * t + b;
  },
  easeOutQuint: function(t, b, _c, d) {
    var c = _c - b;
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  },
  easeInOutQuint: function(t, b, _c, d) {
    var c = _c - b;
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t * t * t + b;
    } else {
      return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    }
  },
  easeInSine: function(t, b, _c, d) {
    var c = _c - b;
    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
  },
  easeOutSine: function(t, b, _c, d) {
    var c = _c - b;
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  },
  easeInOutSine: function(t, b, _c, d) {
    var c = _c - b;
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  },
  easeInExpo: function(t, b, _c, d) {
    var c = _c - b;
    return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
  },
  easeOutExpo: function(t, b, _c, d) {
    var c = _c - b;
    return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
  },
  easeInOutExpo: function(t, b, _c, d) {
    var c = _c - b;
    if (t === 0) {
      return b;
    }
    if (t === d) {
      return b + c;
    }
    if ((t /= d / 2) < 1) {
      return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    } else {
      return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
  },
  easeInCirc: function(t, b, _c, d) {
    var c = _c - b;
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
  },
  easeOutCirc: function(t, b, _c, d) {
    var c = _c - b;
    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
  },
  easeInOutCirc: function(t, b, _c, d) {
    var c = _c - b;
    if ((t /= d / 2) < 1) {
      return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    } else {
      return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    }
  },
  easeInElastic: function(t, b, _c, d) {
    var c = _c - b;
    var a, p, s;
    s = 1.70158;
    p = 0;
    a = c;
    if (t === 0) {
      return b;
    } else if ((t /= d) === 1) {
      return b + c;
    }
    if (!p) {
      p = d * 0.3;
    }
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  },
  easeOutElastic: function(t, b, _c, d) {
    var c = _c - b;
    var a, p, s;
    s = 1.70158;
    p = 0;
    a = c;
    if (t === 0) {
      return b;
    } else if ((t /= d) === 1) {
      return b + c;
    }
    if (!p) {
      p = d * 0.3;
    }
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
  },
  easeInOutElastic: function(t, b, _c, d) {
    var c = _c - b;
    var a, p, s;
    s = 1.70158;
    p = 0;
    a = c;
    if (t === 0) {
      return b;
    } else if ((t /= d / 2) === 2) {
      return b + c;
    }
    if (!p) {
      p = d * (0.3 * 1.5);
    }
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    if (t < 1) {
      return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    } else {
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
    }
  },
  easeInBack: function(t, b, _c, d, s) {
    var c = _c - b;
    if (s === void 0) {
      s = 1.70158;
    }
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  },
  easeOutBack: function(t, b, _c, d, s) {
    var c = _c - b;
    if (s === void 0) {
      s = 1.70158;
    }
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  },
  easeInOutBack: function(t, b, _c, d, s) {
    var c = _c - b;
    if (s === void 0) {
      s = 1.70158;
    }
    if ((t /= d / 2) < 1) {
      return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
    } else {
      return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
    }
  },
  easeInBounce: function(t, b, _c, d) {
    var c = _c - b;
    var v;
    v = tweenFunctions.easeOutBounce(d - t, 0, c, d);
    return c - v + b;
  },
  easeOutBounce: function(t, b, _c, d) {
    var c = _c - b;
    if ((t /= d) < 1 / 2.75) {
      return c * (7.5625 * t * t) + b;
    } else if (t < 2 / 2.75) {
      return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
    } else if (t < 2.5 / 2.75) {
      return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
    } else {
      return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
    }
  },
  easeInOutBounce: function(t, b, _c, d) {
    var c = _c - b;
    var v;
    if (t < d / 2) {
      v = tweenFunctions.easeInBounce(t * 2, 0, c, d);
      return v * 0.5 + b;
    } else {
      v = tweenFunctions.easeOutBounce(t * 2 - d, 0, c, d);
      return v * 0.5 + c * 0.5 + b;
    }
  }
};

module.exports = tweenFunctions;


/***/ }),

/***/ "./src/Confetti.ts":
/*!*************************!*\
  !*** ./src/Confetti.ts ***!
  \*************************/
/*! exports provided: confettiDefaults, Confetti, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "confettiDefaults", function() { return confettiDefaults; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Confetti", function() { return Confetti; });
/* harmony import */ var tween_functions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tween-functions */ "./node_modules/tween-functions/index.js");
/* harmony import */ var tween_functions__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(tween_functions__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ParticleGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ParticleGenerator */ "./src/ParticleGenerator.ts");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



var confettiDefaults = {
  width: typeof window !== 'undefined' ? window.innerWidth : 300,
  height: typeof window !== 'undefined' ? window.innerHeight : 200,
  numberOfPieces: 200,
  friction: 0.99,
  wind: 0,
  gravity: 0.1,
  initialVelocityX: 4,
  initialVelocityY: 10,
  colors: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548'],
  opacity: 1.0,
  debug: false,
  tweenFunction: tween_functions__WEBPACK_IMPORTED_MODULE_0___default.a.easeInOutQuad,
  tweenDuration: 5000,
  recycle: true,
  run: true
};
var Confetti = /*#__PURE__*/function () {
  function Confetti(_canvas, _opts) {
    var _this = this;

    _classCallCheck(this, Confetti);

    _defineProperty(this, "canvas", void 0);

    _defineProperty(this, "context", void 0);

    _defineProperty(this, "_options", void 0);

    _defineProperty(this, "generator", void 0);

    _defineProperty(this, "rafId", void 0);

    _defineProperty(this, "setOptionsWithDefaults", function (opts) {
      var computedConfettiDefaults = {
        confettiSource: {
          x: 0,
          y: 0,
          w: _this.canvas.width,
          h: 0
        }
      };
      _this._options = _objectSpread(_objectSpread(_objectSpread({}, computedConfettiDefaults), confettiDefaults), opts);
      Object.assign(_this, opts.confettiSource);
    });

    _defineProperty(this, "update", function () {
      var _this$options = _this.options,
          run = _this$options.run,
          onConfettiComplete = _this$options.onConfettiComplete,
          canvas = _this.canvas,
          context = _this.context;

      if (run) {
        context.fillStyle = 'white';
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (_this.generator.animate()) {
        _this.rafId = requestAnimationFrame(_this.update);
      } else {
        if (onConfettiComplete && typeof onConfettiComplete === 'function' && _this.generator.particlesGenerated > 0) {
          onConfettiComplete.call(_this, _this);
        }

        _this._options.run = false;
      }
    });

    _defineProperty(this, "reset", function () {
      if (_this.generator && _this.generator.particlesGenerated > 0) {
        _this.generator.particlesGenerated = 0;
        _this.generator.particles = [];
        _this.generator.lastNumberOfPieces = 0;
      }
    });

    _defineProperty(this, "stop", function () {
      _this.options = {
        run: false
      };

      if (_this.rafId) {
        cancelAnimationFrame(_this.rafId);
        _this.rafId = undefined;
      }
    });

    this.canvas = _canvas;
    var ctx = this.canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    this.context = ctx;
    this.generator = new _ParticleGenerator__WEBPACK_IMPORTED_MODULE_1__["default"](this.canvas, function () {
      return _this.options;
    });
    this.options = _opts;
    this.update();
  }

  _createClass(Confetti, [{
    key: "options",
    get: function get() {
      return this._options;
    },
    set: function set(opts) {
      var lastRunState = this._options && this._options.run;
      var lastRecycleState = this._options && this._options.recycle;
      this.setOptionsWithDefaults(opts);

      if (this.generator) {
        Object.assign(this.generator, this.options.confettiSource);

        if (typeof opts.recycle === 'boolean' && opts.recycle && lastRecycleState === false) {
          this.generator.lastNumberOfPieces = this.generator.particles.length;
        }
      }

      if (typeof opts.run === 'boolean' && opts.run && lastRunState === false) {
        this.update();
      }
    }
  }]);

  return Confetti;
}();
/* harmony default export */ __webpack_exports__["default"] = (Confetti);

/***/ }),

/***/ "./src/Particle.ts":
/*!*************************!*\
  !*** ./src/Particle.ts ***!
  \*************************/
/*! exports provided: ParticleShape, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ParticleShape", function() { return ParticleShape; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Particle; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/utils.ts");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var ParticleShape;

(function (ParticleShape) {
  ParticleShape[ParticleShape["Circle"] = 0] = "Circle";
  ParticleShape[ParticleShape["Square"] = 1] = "Square";
  ParticleShape[ParticleShape["Strip"] = 2] = "Strip";
})(ParticleShape || (ParticleShape = {}));

var RotationDirection;

(function (RotationDirection) {
  RotationDirection[RotationDirection["Positive"] = 1] = "Positive";
  RotationDirection[RotationDirection["Negative"] = -1] = "Negative";
})(RotationDirection || (RotationDirection = {}));

var Particle = /*#__PURE__*/function () {
  function Particle(context, getOptions, x, y) {
    _classCallCheck(this, Particle);

    _defineProperty(this, "context", void 0);

    _defineProperty(this, "radius", void 0);

    _defineProperty(this, "x", void 0);

    _defineProperty(this, "y", void 0);

    _defineProperty(this, "w", void 0);

    _defineProperty(this, "h", void 0);

    _defineProperty(this, "vx", void 0);

    _defineProperty(this, "vy", void 0);

    _defineProperty(this, "shape", void 0);

    _defineProperty(this, "angle", void 0);

    _defineProperty(this, "angularSpin", void 0);

    _defineProperty(this, "color", void 0);

    _defineProperty(this, "rotateY", void 0);

    _defineProperty(this, "rotationDirection", void 0);

    _defineProperty(this, "getOptions", void 0);

    this.getOptions = getOptions;

    var _this$getOptions = this.getOptions(),
        colors = _this$getOptions.colors,
        initialVelocityX = _this$getOptions.initialVelocityX,
        initialVelocityY = _this$getOptions.initialVelocityY;

    this.context = context;
    this.x = x;
    this.y = y;
    this.w = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(5, 20);
    this.h = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(5, 20);
    this.radius = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(5, 10);
    this.vx = typeof initialVelocityX === 'number' ? Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(-initialVelocityX, initialVelocityX) : Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(initialVelocityX.min, initialVelocityX.max);
    this.vy = typeof initialVelocityY === 'number' ? Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(-initialVelocityY, 0) : Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(initialVelocityY.min, initialVelocityY.max);
    this.shape = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomInt"])(0, 2);
    this.angle = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["degreesToRads"])(Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(0, 360));
    this.angularSpin = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(-0.2, 0.2);
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.rotateY = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(0, 1);
    this.rotationDirection = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["randomRange"])(0, 1) ? RotationDirection.Positive : RotationDirection.Negative;
  }

  _createClass(Particle, [{
    key: "update",
    value: function update() {
      var _this$getOptions2 = this.getOptions(),
          gravity = _this$getOptions2.gravity,
          wind = _this$getOptions2.wind,
          friction = _this$getOptions2.friction,
          opacity = _this$getOptions2.opacity,
          drawShape = _this$getOptions2.drawShape;

      this.x += this.vx;
      this.y += this.vy;
      this.vy += gravity;
      this.vx += wind;
      this.vx *= friction;
      this.vy *= friction;

      if (this.rotateY >= 1 && this.rotationDirection === RotationDirection.Positive) {
        this.rotationDirection = RotationDirection.Negative;
      } else if (this.rotateY <= -1 && this.rotationDirection === RotationDirection.Negative) {
        this.rotationDirection = RotationDirection.Positive;
      }

      var rotateDelta = 0.1 * this.rotationDirection;
      this.rotateY += rotateDelta;
      this.angle += this.angularSpin;
      this.context.save();
      this.context.translate(this.x, this.y);
      this.context.rotate(this.angle);
      this.context.scale(1, this.rotateY);
      this.context.rotate(this.angle);
      this.context.beginPath();
      this.context.fillStyle = this.color;
      this.context.strokeStyle = this.color;
      this.context.globalAlpha = opacity;
      this.context.lineCap = 'round';
      this.context.lineWidth = 2;

      if (drawShape && typeof drawShape === 'function') {
        drawShape.call(this, this.context);
      } else {
        switch (this.shape) {
          case ParticleShape.Circle:
            {
              this.context.beginPath();
              this.context.arc(0, 0, this.radius, 0, 2 * Math.PI);
              this.context.fill();
              break;
            }

          case ParticleShape.Square:
            {
              this.context.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
              break;
            }

          case ParticleShape.Strip:
            {
              this.context.fillRect(-this.w / 6, -this.h / 2, this.w / 3, this.h);
              break;
            }
        }
      }

      this.context.closePath();
      this.context.restore();
    }
  }]);

  return Particle;
}();



/***/ }),

/***/ "./src/ParticleGenerator.ts":
/*!**********************************!*\
  !*** ./src/ParticleGenerator.ts ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ParticleGenerator; });
/* harmony import */ var _Particle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Particle */ "./src/Particle.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/utils.ts");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




var ParticleGenerator = function ParticleGenerator(_canvas, getOptions) {
  var _this = this;

  _classCallCheck(this, ParticleGenerator);

  _defineProperty(this, "canvas", void 0);

  _defineProperty(this, "context", void 0);

  _defineProperty(this, "getOptions", void 0);

  _defineProperty(this, "x", 0);

  _defineProperty(this, "y", 0);

  _defineProperty(this, "w", 0);

  _defineProperty(this, "h", 0);

  _defineProperty(this, "lastNumberOfPieces", 0);

  _defineProperty(this, "tweenInitTime", Date.now());

  _defineProperty(this, "particles", []);

  _defineProperty(this, "particlesGenerated", 0);

  _defineProperty(this, "removeParticleAt", function (i) {
    _this.particles.splice(i, 1);
  });

  _defineProperty(this, "getParticle", function () {
    var newParticleX = Object(_utils__WEBPACK_IMPORTED_MODULE_1__["randomRange"])(_this.x, _this.w + _this.x);
    var newParticleY = Object(_utils__WEBPACK_IMPORTED_MODULE_1__["randomRange"])(_this.y, _this.h + _this.y);
    return new _Particle__WEBPACK_IMPORTED_MODULE_0__["default"](_this.context, _this.getOptions, newParticleX, newParticleY);
  });

  _defineProperty(this, "animate", function () {
    var canvas = _this.canvas,
        context = _this.context,
        particlesGenerated = _this.particlesGenerated,
        lastNumberOfPieces = _this.lastNumberOfPieces;

    var _this$getOptions = _this.getOptions(),
        run = _this$getOptions.run,
        recycle = _this$getOptions.recycle,
        numberOfPieces = _this$getOptions.numberOfPieces,
        debug = _this$getOptions.debug,
        tweenFunction = _this$getOptions.tweenFunction,
        tweenDuration = _this$getOptions.tweenDuration;

    if (!run) {
      return false;
    }

    var nP = _this.particles.length;
    var activeCount = recycle ? nP : particlesGenerated;
    var now = Date.now(); // Initial population

    if (activeCount < numberOfPieces) {
      // Use the numberOfPieces prop as a key to reset the easing timing
      if (lastNumberOfPieces !== numberOfPieces) {
        _this.tweenInitTime = now;
        _this.lastNumberOfPieces = numberOfPieces;
      }

      var tweenInitTime = _this.tweenInitTime; // Add more than one piece per loop, otherwise the number of pieces would
      // be limitted by the RAF framerate

      var progressTime = now - tweenInitTime > tweenDuration ? tweenDuration : Math.max(0, now - tweenInitTime);
      var tweenedVal = tweenFunction(progressTime, activeCount, numberOfPieces, tweenDuration);
      var numToAdd = Math.round(tweenedVal - activeCount);

      for (var i = 0; i < numToAdd; i++) {
        _this.particles.push(_this.getParticle());
      }

      _this.particlesGenerated += numToAdd;
    }

    if (debug) {
      // Draw debug text
      context.font = '12px sans-serif';
      context.fillStyle = '#333';
      context.textAlign = 'right';
      context.fillText("Particles: ".concat(nP), canvas.width - 10, canvas.height - 20);
    } // Maintain the population


    _this.particles.forEach(function (p, i) {
      // Update each particle's position
      p.update(); // Prune the off-canvas particles

      if (p.y > canvas.height || p.y < -100 || p.x > canvas.width + 100 || p.x < -100) {
        if (recycle && activeCount <= numberOfPieces) {
          // Replace the particle with a brand new one
          _this.particles[i] = _this.getParticle();
        } else {
          _this.removeParticleAt(i);
        }
      }
    });

    return nP > 0 || activeCount < numberOfPieces;
  });

  this.canvas = _canvas;
  var ctx = this.canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  this.context = ctx;
  this.getOptions = getOptions;
};



/***/ }),

/***/ "./src/ReactConfetti.tsx":
/*!*******************************!*\
  !*** ./src/ReactConfetti.tsx ***!
  \*******************************/
/*! exports provided: ReactConfetti, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ReactConfetti", function() { return ReactConfetti; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Confetti__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Confetti */ "./src/Confetti.ts");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



var ref = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createRef();

var ReactConfettiInternal = /*#__PURE__*/function (_Component) {
  _inherits(ReactConfettiInternal, _Component);

  var _super = _createSuper(ReactConfettiInternal);

  function ReactConfettiInternal(props) {
    var _this;

    _classCallCheck(this, ReactConfettiInternal);

    for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this, props].concat(rest));

    _defineProperty(_assertThisInitialized(_this), "canvas", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createRef());

    _defineProperty(_assertThisInitialized(_this), "confetti", void 0);

    _this.canvas = props.canvasRef || ref;
    return _this;
  }

  _createClass(ReactConfettiInternal, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (this.canvas.current) {
        var opts = extractCanvasProps(this.props)[0];
        this.confetti = new _Confetti__WEBPACK_IMPORTED_MODULE_1__["default"](this.canvas.current, opts);
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      var confettiOptions = extractCanvasProps(this.props)[0];

      if (this.confetti) {
        this.confetti.options = confettiOptions;
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.confetti) {
        this.confetti.stop();
      }

      this.confetti = undefined;
    }
  }, {
    key: "render",
    value: function render() {
      var _extractCanvasProps = extractCanvasProps(this.props),
          _extractCanvasProps2 = _slicedToArray(_extractCanvasProps, 2),
          confettiOptions = _extractCanvasProps2[0],
          passedProps = _extractCanvasProps2[1];

      var canvasStyles = _objectSpread({
        zIndex: 2,
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
      }, passedProps.style);

      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("canvas", _extends({
        width: confettiOptions.width,
        height: confettiOptions.height,
        ref: this.canvas
      }, passedProps, {
        style: canvasStyles
      }));
    }
  }]);

  return ReactConfettiInternal;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

_defineProperty(ReactConfettiInternal, "defaultProps", _objectSpread({}, _Confetti__WEBPACK_IMPORTED_MODULE_1__["confettiDefaults"]));

_defineProperty(ReactConfettiInternal, "displayName", 'ReactConfetti');

function extractCanvasProps(props) {
  var confettiOptions = {};
  var refs = {};
  var rest = {};
  var confettiOptionKeys = [].concat(_toConsumableArray(Object.keys(_Confetti__WEBPACK_IMPORTED_MODULE_1__["confettiDefaults"])), ['confettiSource', 'drawShape', 'onConfettiComplete']);
  var refProps = ['canvasRef'];

  for (var prop in props) {
    var val = props[prop];

    if (confettiOptionKeys.includes(prop)) {
      confettiOptions[prop] = val;
    } else if (refProps.includes(prop)) {
      refProps[prop] = val;
    } else {
      rest[prop] = val;
    }
  }

  return [confettiOptions, rest, refs];
}

var ReactConfetti = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.forwardRef(function (props, ref) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(ReactConfettiInternal, _extends({
    canvasRef: ref
  }, props));
});
/* harmony default export */ __webpack_exports__["default"] = (ReactConfetti);

/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/*! exports provided: norm, lerp, map, clamp, distance, distanceXY, circleCollision, circlePointCollision, inRange, pointInRect, rangeIntersect, rectIntersect, degreesToRads, radsToDegrees, randomRange, randomInt */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "norm", function() { return norm; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lerp", function() { return lerp; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "map", function() { return map; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clamp", function() { return clamp; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "distance", function() { return distance; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "distanceXY", function() { return distanceXY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "circleCollision", function() { return circleCollision; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "circlePointCollision", function() { return circlePointCollision; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "inRange", function() { return inRange; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pointInRect", function() { return pointInRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "rangeIntersect", function() { return rangeIntersect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "rectIntersect", function() { return rectIntersect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "degreesToRads", function() { return degreesToRads; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "radsToDegrees", function() { return radsToDegrees; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "randomRange", function() { return randomRange; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "randomInt", function() { return randomInt; });
function norm(value, min, max) {
  return (value - min) / (max - min);
}
function lerp(lnorm, min, max) {
  return (max - min) * lnorm + min;
}
function map(value, sourceMin, sourceMax, destMin, destMax) {
  return lerp(norm(value, sourceMin, sourceMax), destMin, destMax);
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
}
function distance(p0, p1) {
  var dx = p1.x - p0.x;
  var dy = p1.y - p0.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function distanceXY(x0, y0, x1, y1) {
  var dx = x1 - x0;
  var dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
}
function circleCollision(c0, c1) {
  return distance(c0, c1) <= c0.radius + c1.radius;
}
function circlePointCollision(x, y, circle) {
  return distanceXY(x, y, circle.x, circle.y) < circle.radius;
}
function inRange(value, min, max) {
  return value >= Math.min(min, max) && value <= Math.max(min, max);
}
function pointInRect(p, rect) {
  return inRange(p.x, rect.x, rect.x + rect.w) && inRange(p.y, rect.y, rect.y + rect.h);
}
function rangeIntersect(min0, max0, min1, max1) {
  return Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.max(min1, max1);
}
function rectIntersect(r0, r1) {
  return rangeIntersect(r0.x, r0.x + r0.w, r1.x, r1.x + r1.w) && rangeIntersect(r0.y, r0.y + r0.h, r1.y, r1.y + r1.h);
}
function degreesToRads(degrees) {
  return degrees * Math.PI / 180;
}
function radsToDegrees(radians) {
  return radians * 180 / Math.PI;
}
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/***/ }),

/***/ 0:
/*!*************************************!*\
  !*** multi ./src/ReactConfetti.tsx ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./src/ReactConfetti.tsx */"./src/ReactConfetti.tsx");


/***/ }),

/***/ "react":
/*!**************************************************************************************!*\
  !*** external {"root":"React","commonjs2":"react","commonjs":"react","amd":"react"} ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_react__;

/***/ })

/******/ })["default"];
});
//# sourceMappingURL=react-confetti.js.map