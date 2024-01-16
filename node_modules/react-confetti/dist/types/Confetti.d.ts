import { IRect } from './Rect';
import ParticleGenerator from './ParticleGenerator';
export interface IConfettiOptions {
    /**
     * Width of the component
     * @default window.width
     */
    width: number;
    /**
     * Height of the component
     * @default window.height
     */
    height: number;
    /**
     * Max number of confetti pieces to render.
     * @default 200
     */
    numberOfPieces: number;
    /**
     * Slows movement of pieces. (lower number = slower confetti)
     * @default 0.99
     */
    friction: number;
    /**
     * Blows confetti along the X axis.
     * @default 0
     */
    wind: number;
    /**
     * How fast it falls (pixels per frame)
     * @default 0.1
     */
    gravity: number;
    /**
     * How fast the confetti is emitted horizontally
     * @default 4
     */
    initialVelocityX: {
        min: number;
        max: number;
    } | number;
    /**
     * How fast the confetti is emitted vertically
     * @default 10
     */
    initialVelocityY: {
        min: number;
        max: number;
    } | number;
    /**
     * Array of colors to choose from.
     */
    colors: string[];
    /**
     * Opacity of the confetti.
     * @default 1
     */
    opacity: number;
    /**
     * If false, only numberOfPieces will be emitted and then stops. If true, when a confetto goes offscreen, a new one will be emitted.
     * @default true
     */
    recycle: boolean;
    /**
     * If false, stops the requestAnimationFrame loop.
     * @default true
     */
    run: boolean;
    /**
     * Renders some debug text on the canvas.
     * @default false
     */
    debug: boolean;
    /**
     * A Rect defining the area where the confetti will spawn.
     * @default {
     *   x: 0,
     *   y: 0,
     *   w: canvas.width,
     *   h: 0
     * }
     */
    confettiSource: IRect;
    /**
     * Controls the rate at which confetti is spawned.
     * @default easeInOutQuad
     */
    tweenFunction: (currentTime: number, currentValue: number, targetValue: number, duration: number, s?: number) => number;
    /**
     * Number of milliseconds it should take to spawn numberOfPieces.
     * @default 5000
     */
    tweenDuration: number;
    /**
     * Function to draw your own confetti shapes.
     */
    drawShape?: (context: CanvasRenderingContext2D) => void;
    /**
     * Function called when all confetti has fallen off-canvas.
     */
    onConfettiComplete?: (confettiInstance?: Confetti) => void;
}
export declare const confettiDefaults: Pick<IConfettiOptions, Exclude<keyof IConfettiOptions, 'confettiSource'>>;
export declare class Confetti {
    constructor(canvas: HTMLCanvasElement, opts: Partial<IConfettiOptions>);
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    _options: IConfettiOptions;
    generator: ParticleGenerator;
    rafId?: number;
    get options(): Partial<IConfettiOptions>;
    set options(opts: Partial<IConfettiOptions>);
    setOptionsWithDefaults: (opts: Partial<IConfettiOptions>) => void;
    update: () => void;
    reset: () => void;
    stop: () => void;
}
export default Confetti;
