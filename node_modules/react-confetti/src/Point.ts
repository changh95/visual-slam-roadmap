export interface IPoint {
  x: number
  y: number
}

export default class Point implements IPoint {
  constructor(init: IPoint) {
    this.x = init.x
    this.y = init.y
  }

  x: number

  y: number
}
