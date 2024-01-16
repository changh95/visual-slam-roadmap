import type { Options } from './types.js';
export declare const updateScrollPosition: (positions: {
    scrollX: number;
    scrollY: number;
}) => void;
export declare const supportsViewTransitions: boolean;
export declare const transitionEnabledOnThisPage: () => boolean;
export declare function navigate(href: string, options?: Options): Promise<void>;
