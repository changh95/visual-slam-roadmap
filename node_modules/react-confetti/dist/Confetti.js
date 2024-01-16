"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Confetti = exports.confettiDefaults = void 0;

var _tweenFunctions = _interopRequireDefault(require("tween-functions"));

var _ParticleGenerator = _interopRequireDefault(require("./ParticleGenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
  tweenFunction: _tweenFunctions["default"].easeInOutQuad,
  tweenDuration: 5000,
  recycle: true,
  run: true
};
exports.confettiDefaults = confettiDefaults;

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
    this.generator = new _ParticleGenerator["default"](this.canvas, function () {
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

exports.Confetti = Confetti;
var _default = Confetti;
exports["default"] = _default;