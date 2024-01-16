import type { AstroCookies, ComponentInstance } from '../../@types/astro.js';
import type { RenderContext } from './context.js';
import type { Environment } from './environment.js';
export type RenderPage = {
    mod: ComponentInstance | undefined;
    renderContext: RenderContext;
    env: Environment;
    cookies: AstroCookies;
};
export declare function renderPage({ mod, renderContext, env, cookies }: RenderPage): Promise<Response>;
