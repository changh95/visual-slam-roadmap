import { IConfettiOptions } from './Confetti';
import { IRect } from './Rect';
import Particle from './Particle';
export interface IParticleGenerator extends IRect {
    removeParticleAt: (index: number) => void;
    getParticle: () => void;
    animate: () => boolean;
    particles: Particle[];
    particlesGenerated: number;
}
export default class ParticleGenerator implements IParticleGenerator {
    constructor(canvas: HTMLCanvasElement, getOptions: () => IConfettiOptions);
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    getOptions: () => IConfettiOptions;
    x: number;
    y: number;
    w: number;
    h: number;
    lastNumberOfPieces: number;
    tweenInitTime: number;
    particles: Particle[];
    particlesGenerated: number;
    removeParticleAt: (i: number) => void;
    getParticle: () => Particle;
    animate: () => boolean;
}
