import type { AstroConfig, RoutePart } from '../../../@types/astro.js';
export declare function getRouteGenerator(segments: RoutePart[][], addTrailingSlash: AstroConfig['trailingSlash']): import("path-to-regexp").PathFunction<object>;
