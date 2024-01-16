"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.ParticleShape = void 0;

var _utils = require("./utils");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ParticleShape;
exports.ParticleShape = ParticleShape;

(function (ParticleShape) {
  ParticleShape[ParticleShape["Circle"] = 0] = "Circle";
  ParticleShape[ParticleShape["Square"] = 1] = "Square";
  ParticleShape[ParticleShape["Strip"] = 2] = "Strip";
})(ParticleShape || (exports.ParticleShape = ParticleShape = {}));

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
    this.w = (0, _utils.randomRange)(5, 20);
    this.h = (0, _utils.randomRange)(5, 20);
    this.radius = (0, _utils.randomRange)(5, 10);
    this.vx = typeof initialVelocityX === 'number' ? (0, _utils.randomRange)(-initialVelocityX, initialVelocityX) : (0, _utils.randomRange)(initialVelocityX.min, initialVelocityX.max);
    this.vy = typeof initialVelocityY === 'number' ? (0, _utils.randomRange)(-initialVelocityY, 0) : (0, _utils.randomRange)(initialVelocityY.min, initialVelocityY.max);
    this.shape = (0, _utils.randomInt)(0, 2);
    this.angle = (0, _utils.degreesToRads)((0, _utils.randomRange)(0, 360));
    this.angularSpin = (0, _utils.randomRange)(-0.2, 0.2);
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.rotateY = (0, _utils.randomRange)(0, 1);
    this.rotationDirection = (0, _utils.randomRange)(0, 1) ? RotationDirection.Positive : RotationDirection.Negative;
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

exports["default"] = Particle;