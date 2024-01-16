import { IPoint } from './Point'
import { IRect } from './Rect'
import { ICircle } from './Circle'

export function norm(value: number, min:number, max: number) {
  return (value - min) / (max - min)
}

export function lerp(lnorm: number, min: number, max: number) {
  return ((max - min) * lnorm) + min
}

export function map(value: number, sourceMin: number, sourceMax: number, destMin: number, destMax: number) {
  return lerp(norm(value, sourceMin, sourceMax), destMin, destMax)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))
}

export function distance(p0: IPoint, p1: IPoint) {
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  return Math.sqrt((dx * dx) + (dy * dy))
}

export function distanceXY(x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0
  const dy = y1 - y0
  return Math.sqrt((dx * dx) + (dy * dy))
}

export function circleCollision(c0: ICircle, c1: ICircle) {
  return distance(c0, c1) <= c0.radius + c1.radius
}

export function circlePointCollision(x: number, y:number, circle: ICircle) {
  return distanceXY(x, y, circle.x, circle.y) < circle.radius
}

export function inRange(value: number, min: number, max: number) {
  return value >= Math.min(min, max) && value <= Math.max(min, max)
}

export function pointInRect(p: IPoint, rect: IRect) {
  return inRange(p.x, rect.x, rect.x + rect.w) &&
    inRange(p.y, rect.y, rect.y + rect.h)
}

export function rangeIntersect(min0: number, max0: number, min1: number, max1: number) {
  return Math.max(min0, max0) >= Math.min(min1, max1) &&
    Math.min(min0, max0) <= Math.max(min1, max1)
}

export function rectIntersect(r0: IRect, r1: IRect) {
  return rangeIntersect(r0.x, r0.x + r0.w, r1.x, r1.x + r1.w) &&
    rangeIntersect(r0.y, r0.y + r0.h, r1.y, r1.y + r1.h)
}

export function degreesToRads(degrees: number) {
  return degrees * Math.PI / 180
}

export function radsToDegrees(radians: number) {
  return (radians * 180) / Math.PI
}

export function randomRange(min: number, max: number) {
  return min + (Math.random() * (max - min))
}

export function randomInt(min: number, max: number) {
  return Math.floor(min + (Math.random() * ((max - min) + 1)))
}
