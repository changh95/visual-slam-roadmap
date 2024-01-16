import { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration } from 'astro';
export type ReactIntegrationOptions = Pick<ViteReactPluginOptions, 'include' | 'exclude'> & {
    experimentalReactChildren?: boolean;
};
export default function ({ include, exclude, experimentalReactChildren, }?: ReactIntegrationOptions): AstroIntegration;
