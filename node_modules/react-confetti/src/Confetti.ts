import tweens from 'tween-functions'
import { IRect } from './Rect'
import ParticleGenerator from './ParticleGenerator'

export interface IConfettiOptions {
  /**
   * Width of the component
   * @default window.width
   */
  width: number
  /**
   * Height of the component
   * @default window.height
   */
  height: number
  /**
   * Max number of confetti pieces to render.
   * @default 200
   */
  numberOfPieces: number
  /**
   * Slows movement of pieces. (lower number = slower confetti)
   * @default 0.99
   */
  friction: number
  /**
   * Blows confetti along the X axis.
   * @default 0
   */
  wind: number
  /**
   * How fast it falls (pixels per frame)
   * @default 0.1
   */
  gravity: number
  /**
   * How fast the confetti is emitted horizontally
   * @default 4
   */
  initialVelocityX: {min: number, max: number} | number
  /**
   * How fast the confetti is emitted vertically
   * @default 10
   */
  initialVelocityY: {min: number, max: number} | number
  /**
   * Array of colors to choose from.
   */
  colors: string[]
  /**
   * Opacity of the confetti.
   * @default 1
   */
  opacity: number
  /**
   * If false, only numberOfPieces will be emitted and then stops. If true, when a confetto goes offscreen, a new one will be emitted.
   * @default true
   */
  recycle: boolean
  /**
   * If false, stops the requestAnimationFrame loop.
   * @default true
   */
  run: boolean
  /**
   * Renders some debug text on the canvas.
   * @default false
   */
  debug: boolean
  /**
   * A Rect defining the area where the confetti will spawn.
   * @default {
   *   x: 0,
   *   y: 0,
   *   w: canvas.width,
   *   h: 0
   * }
   */
  confettiSource: IRect
  /**
   * Controls the rate at which confetti is spawned.
   * @default easeInOutQuad
   */
  tweenFunction: (currentTime: number, currentValue: number, targetValue: number, duration: number, s?: number) => number
  /**
   * Number of milliseconds it should take to spawn numberOfPieces.
   * @default 5000
   */
  tweenDuration: number
  /**
   * Function to draw your own confetti shapes.
   */
  drawShape?: (context: CanvasRenderingContext2D) => void
  /**
   * Function called when all confetti has fallen off-canvas.
   */
  onConfettiComplete?: (confettiInstance?: Confetti) => void
}

export const confettiDefaults: Pick<IConfettiOptions, Exclude<keyof IConfettiOptions, 'confettiSource'>> = {
  width: typeof window !== 'undefined' ? window.innerWidth : 300,
  height: typeof window !== 'undefined' ? window.innerHeight : 200,
  numberOfPieces: 200,
  friction: 0.99,
  wind: 0,
  gravity: 0.1,
  initialVelocityX: 4,
  initialVelocityY: 10,
  colors: [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548',
  ],
  opacity: 1.0,
  debug: false,
  tweenFunction: tweens.easeInOutQuad,
  tweenDuration: 5000,
  recycle: true,
  run: true,
}

export class Confetti {
  constructor(canvas: HTMLCanvasElement, opts: Partial<IConfettiOptions>) {
    this.canvas = canvas
    const ctx = this.canvas.getContext('2d')
    if(!ctx) {
      throw new Error('Could not get canvas context')
    }
    this.context = ctx

    this.generator = new ParticleGenerator(this.canvas, () => (this.options as IConfettiOptions))
    this.options = opts
    this.update()
  }

  canvas: HTMLCanvasElement

  context: CanvasRenderingContext2D

  _options!: IConfettiOptions

  generator: ParticleGenerator

  rafId?: number

  get options(): Partial<IConfettiOptions> {
    return this._options
  }

  set options(opts: Partial<IConfettiOptions>) {
    const lastRunState = this._options && this._options.run
    const lastRecycleState = this._options && this._options.recycle
    this.setOptionsWithDefaults(opts)
    if(this.generator) {
      Object.assign(this.generator, this.options.confettiSource)
      if(typeof opts.recycle === 'boolean' && opts.recycle && lastRecycleState === false) {
        this.generator.lastNumberOfPieces = this.generator.particles.length
      }
    }
    if(typeof opts.run === 'boolean' && opts.run && lastRunState === false) {
      this.update()
    }
  }

  setOptionsWithDefaults = (opts: Partial<IConfettiOptions>) => {
    const computedConfettiDefaults = {
      confettiSource: {
        x: 0,
        y: 0,
        w: this.canvas.width,
        h: 0,
      },
    }
    this._options = { ...computedConfettiDefaults, ...confettiDefaults, ...opts }
    Object.assign(this, opts.confettiSource)
  }

  update = () => {
    const {
      options: {
        run,
        onConfettiComplete,
      },
      canvas,
      context,
    } = this
    if(run) {
      context.fillStyle = 'white'
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
    if(this.generator.animate()) {
      this.rafId = requestAnimationFrame(this.update)
    } else {
      if(onConfettiComplete && typeof onConfettiComplete === 'function' && this.generator.particlesGenerated > 0) {
        onConfettiComplete.call(this, this)
      }
      this._options.run = false
    }
  }

  reset = () => {
    if(this.generator && this.generator.particlesGenerated > 0) {
      this.generator.particlesGenerated = 0
      this.generator.particles = []
      this.generator.lastNumberOfPieces = 0
    }
  }

  stop = () => {
    this.options = { run: false }
    if(this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = undefined
    }
  }
}

export default Confetti
