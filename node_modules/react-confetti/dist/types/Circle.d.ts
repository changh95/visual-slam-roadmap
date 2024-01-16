import { IPoint } from './Point';
export interface ICircle extends IPoint {
    radius: number;
}
export default class Circle implements ICircle {
    constructor(init: ICircle);
    x: number;
    y: number;
    radius: number;
}
