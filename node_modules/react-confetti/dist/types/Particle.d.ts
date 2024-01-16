import { IConfettiOptions } from './Confetti';
export declare enum ParticleShape {
    Circle = 0,
    Square = 1,
    Strip = 2
}
declare enum RotationDirection {
    Positive = 1,
    Negative = -1
}
export default class Particle {
    constructor(context: CanvasRenderingContext2D, getOptions: () => IConfettiOptions, x: number, y: number);
    context: CanvasRenderingContext2D;
    radius: number;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    shape: ParticleShape;
    angle: number;
    angularSpin: number;
    color: string;
    rotateY: number;
    rotationDirection: RotationDirection;
    getOptions: () => IConfettiOptions;
    update(): void;
}
export {};
