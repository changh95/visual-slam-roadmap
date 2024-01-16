import { randomRange, randomInt, degreesToRads } from './utils'
import { IConfettiOptions } from './Confetti'

export enum ParticleShape {
  Circle = 0,
  Square,
  Strip,
}

enum RotationDirection {
  Positive = 1,
  Negative = -1,
}

export default class Particle {
  constructor(context: CanvasRenderingContext2D, getOptions: () => IConfettiOptions, x: number, y: number) {
    this.getOptions = getOptions
    const {
      colors,
      initialVelocityX,
      initialVelocityY,
    } = this.getOptions()
    this.context = context
    this.x = x
    this.y = y
    this.w = randomRange(5, 20)
    this.h = randomRange(5, 20)
    this.radius = randomRange(5, 10)
    this.vx = typeof initialVelocityX === 'number' ? randomRange(-initialVelocityX, initialVelocityX) : randomRange(initialVelocityX.min, initialVelocityX.max)
    this.vy = typeof initialVelocityY === 'number' ? randomRange(-initialVelocityY, 0) : randomRange(initialVelocityY.min, initialVelocityY.max)
    this.shape = randomInt(0, 2)
    this.angle = degreesToRads(randomRange(0, 360))
    this.angularSpin = randomRange(-0.2, 0.2)
    this.color = colors[Math.floor(Math.random() * colors.length)]
    this.rotateY = randomRange(0, 1)
    this.rotationDirection = randomRange(0, 1) ? RotationDirection.Positive : RotationDirection.Negative
  }

  context: CanvasRenderingContext2D

  radius: number

  x: number

  y: number

  w: number

  h: number

  vx: number

  vy: number

  shape: ParticleShape

  angle: number

  angularSpin: number

  color: string

  // Actually used as scaleY to simulate rotation cheaply
  rotateY: number

  rotationDirection: RotationDirection

  getOptions: () => IConfettiOptions

  update() {
    const {
      gravity,
      wind,
      friction,
      opacity,
      drawShape,
    } = this.getOptions()
    this.x += this.vx
    this.y += this.vy
    this.vy += gravity
    this.vx += wind
    this.vx *= friction
    this.vy *= friction
    if(this.rotateY >= 1 && this.rotationDirection === RotationDirection.Positive) {
      this.rotationDirection = RotationDirection.Negative
    } else if(this.rotateY <= -1 && this.rotationDirection === RotationDirection.Negative) {
      this.rotationDirection = RotationDirection.Positive
    }

    const rotateDelta = 0.1 * this.rotationDirection

    this.rotateY += rotateDelta
    this.angle += this.angularSpin
    this.context.save()
    this.context.translate(this.x, this.y)
    this.context.rotate(this.angle)
    this.context.scale(1, this.rotateY)
    this.context.rotate(this.angle)
    this.context.beginPath()
    this.context.fillStyle = this.color
    this.context.strokeStyle = this.color
    this.context.globalAlpha = opacity
    this.context.lineCap = 'round'
    this.context.lineWidth = 2
    if(drawShape && typeof drawShape === 'function') {
      drawShape.call(this, this.context)
    } else {
      switch(this.shape) {
        case ParticleShape.Circle: {
          this.context.beginPath()
          this.context.arc(0, 0, this.radius, 0, 2 * Math.PI)
          this.context.fill()
          break
        }
        case ParticleShape.Square: {
          this.context.fillRect(-this.w / 2, -this.h / 2, this.w, this.h)
          break
        }
        case ParticleShape.Strip: {
          this.context.fillRect(-this.w / 6, -this.h / 2, this.w / 3, this.h)
          break
        }
      }
    }
    this.context.closePath()
    this.context.restore()
  }
}
