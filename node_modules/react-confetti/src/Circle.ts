import { IPoint } from './Point'

export interface ICircle extends IPoint {
  radius: number
}

export default class Circle implements ICircle {
  constructor(init: ICircle) {
    this.x = init.x
    this.y = init.y
    this.radius = init.radius
  }

  x: number

  y: number

  radius: number
}
