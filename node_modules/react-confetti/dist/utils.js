"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.norm = norm;
exports.lerp = lerp;
exports.map = map;
exports.clamp = clamp;
exports.distance = distance;
exports.distanceXY = distanceXY;
exports.circleCollision = circleCollision;
exports.circlePointCollision = circlePointCollision;
exports.inRange = inRange;
exports.pointInRect = pointInRect;
exports.rangeIntersect = rangeIntersect;
exports.rectIntersect = rectIntersect;
exports.degreesToRads = degreesToRads;
exports.radsToDegrees = radsToDegrees;
exports.randomRange = randomRange;
exports.randomInt = randomInt;

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