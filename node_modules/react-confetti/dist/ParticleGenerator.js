"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Particle = _interopRequireDefault(require("./Particle"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
    var newParticleX = (0, _utils.randomRange)(_this.x, _this.w + _this.x);
    var newParticleY = (0, _utils.randomRange)(_this.y, _this.h + _this.y);
    return new _Particle["default"](_this.context, _this.getOptions, newParticleX, newParticleY);
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

exports["default"] = ParticleGenerator;