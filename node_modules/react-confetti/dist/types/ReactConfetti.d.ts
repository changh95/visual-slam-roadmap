import React, { CanvasHTMLAttributes } from 'react';
import { IConfettiOptions } from './Confetti';
export declare type Props = Partial<IConfettiOptions> & CanvasHTMLAttributes<HTMLCanvasElement> & {
    canvasRef?: React.Ref<HTMLCanvasElement>;
};
export declare const ReactConfetti: React.ForwardRefExoticComponent<Partial<IConfettiOptions> & React.CanvasHTMLAttributes<HTMLCanvasElement> & {
    canvasRef?: React.RefObject<HTMLCanvasElement> | ((instance: HTMLCanvasElement | null) => void) | null | undefined;
} & React.RefAttributes<HTMLCanvasElement>>;
export default ReactConfetti;
