import type { RouteData, SSRResult } from '../../../@types/astro.js';
import { type RenderInstruction } from './instruction.js';
import type { HTMLBytes } from '../escape.js';
import { type RenderInstance } from './common.js';
declare const needsHeadRenderingSymbol: unique symbol;
export type ComponentIterable = AsyncIterable<string | HTMLBytes | RenderInstruction>;
export declare function renderComponent(result: SSRResult, displayName: string, Component: unknown, props: Record<string | number, any>, slots?: any): Promise<RenderInstance>;
export declare function renderComponentToString(result: SSRResult, displayName: string, Component: unknown, props: Record<string | number, any>, slots?: any, isPage?: boolean, route?: RouteData): Promise<string>;
export type NonAstroPageComponent = {
    name: string;
    [needsHeadRenderingSymbol]: boolean;
};
export {};
