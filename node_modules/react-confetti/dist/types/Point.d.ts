export interface IPoint {
    x: number;
    y: number;
}
export default class Point implements IPoint {
    constructor(init: IPoint);
    x: number;
    y: number;
}
