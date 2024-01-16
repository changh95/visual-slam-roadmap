"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Point = function Point(init) {
  _classCallCheck(this, Point);

  _defineProperty(this, "x", void 0);

  _defineProperty(this, "y", void 0);

  this.x = init.x;
  this.y = init.y;
};

exports["default"] = Point;