import type { Rollup } from 'vite';
import type { RouteData, SSRResult } from '../../@types/astro.js';
import type { PageOptions } from '../../vite-plugin-astro/types.js';
import type { AllPagesData, PageBuildData, StylesheetAsset, ViteID } from './types.js';
export interface BuildInternals {
    /**
     * Each CSS module is named with a chunk id derived from the Astro pages they
     * are used in by default. It's easy to crawl this relation in the SSR build as
     * the Astro pages are the entrypoint, but not for the client build as hydratable
     * components are the entrypoint instead. This map is used as a cache from the SSR
     * build so the client can pick up the same information and use the same chunk ids.
     */
    cssModuleToChunkIdMap: Map<string, string>;
    hoistedScriptIdToHoistedMap: Map<string, Set<string>>;
    hoistedScriptIdToPagesMap: Map<string, Set<string>>;
    entrySpecifierToBundleMap: Map<string, string>;
    /**
     * A map to get a specific page's bundled output file.
     */
    pageToBundleMap: Map<string, string>;
    /**
     * A map for page-specific information.
     */
    pagesByComponent: Map<string, PageBuildData>;
    /**
     * A map for page-specific output.
     */
    pageOptionsByPage: Map<string, PageOptions>;
    /**
     * A map for page-specific information by Vite ID (a path-like string)
     */
    pagesByViteID: Map<ViteID, PageBuildData>;
    /**
     * A map for page-specific information by a client:only component
     */
    pagesByClientOnly: Map<string, Set<PageBuildData>>;
    /**
     * A map of hydrated components to export names that are discovered during the SSR build.
     * These will be used as the top-level entrypoints for the client build.
     *
     * @example
     * '/project/Component1.jsx' => ['default']
     * '/project/Component2.jsx' => ['Counter', 'Timer']
     * '/project/Component3.jsx' => ['*']
     */
    discoveredHydratedComponents: Map<string, string[]>;
    /**
     * A list of client:only components to export names that are discovered during the SSR build.
     * These will be used as the top-level entrypoints for the client build.
     *
     * @example
     * '/project/Component1.jsx' => ['default']
     * '/project/Component2.jsx' => ['Counter', 'Timer']
     * '/project/Component3.jsx' => ['*']
     */
    discoveredClientOnlyComponents: Map<string, string[]>;
    /**
     * A list of hoisted scripts that are discovered during the SSR build
     * These will be used as the top-level entrypoints for the client build.
     */
    discoveredScripts: Set<string>;
    cachedClientEntries: string[];
    propagatedStylesMap: Map<string, Set<StylesheetAsset>>;
    propagatedScriptsMap: Map<string, Set<string>>;
    staticFiles: Set<string>;
    ssrEntryChunk?: Rollup.OutputChunk;
    manifestEntryChunk?: Rollup.OutputChunk;
    manifestFileName?: string;
    entryPoints: Map<RouteData, URL>;
    ssrSplitEntryChunks: Map<string, Rollup.OutputChunk>;
    componentMetadata: SSRResult['componentMetadata'];
    middlewareEntryPoint?: URL;
}
/**
 * Creates internal maps used to coordinate the CSS and HTML plugins.
 * @returns {BuildInternals}
 */
export declare function createBuildInternals(): BuildInternals;
export declare function trackPageData(internals: BuildInternals, component: string, pageData: PageBuildData, componentModuleId: string, componentURL: URL): void;
/**
 * Tracks client-only components to the pages they are associated with.
 */
export declare function trackClientOnlyPageDatas(internals: BuildInternals, pageData: PageBuildData, clientOnlys: string[]): void;
export declare function getPageDatasByChunk(internals: BuildInternals, chunk: Rollup.RenderedChunk): Generator<PageBuildData, void, unknown>;
export declare function getPageDatasByClientOnlyID(internals: BuildInternals, viteid: ViteID): Generator<PageBuildData, void, unknown>;
export declare function getPageDataByComponent(internals: BuildInternals, component: string): PageBuildData | undefined;
export declare function getPageDataByViteID(internals: BuildInternals, viteid: ViteID): PageBuildData | undefined;
export declare function hasPageDataByViteID(internals: BuildInternals, viteid: ViteID): boolean;
export declare function eachPageData(internals: BuildInternals): Generator<PageBuildData, void, undefined>;
export declare function eachPageFromAllPages(allPages: AllPagesData): Generator<[string, PageBuildData]>;
export declare function eachPageDataFromEntryPoint(internals: BuildInternals): Generator<[PageBuildData, string]>;
export declare function hasPrerenderedPages(internals: BuildInternals): boolean;
interface OrderInfo {
    depth: number;
    order: number;
}
/**
 * Sort a page's CSS by depth. A higher depth means that the CSS comes from shared subcomponents.
 * A lower depth means it comes directly from the top-level page.
 * Can be used to sort stylesheets so that shared rules come first
 * and page-specific rules come after.
 */
export declare function cssOrder(a: OrderInfo, b: OrderInfo): 1 | -1;
export declare function mergeInlineCss(acc: Array<StylesheetAsset>, current: StylesheetAsset): Array<StylesheetAsset>;
export declare function isHoistedScript(internals: BuildInternals, id: string): boolean;
export declare function getPageDatasByHoistedScriptId(internals: BuildInternals, id: string): Generator<PageBuildData, void, unknown>;
export declare function getEntryFilePathFromComponentPath(internals: BuildInternals, path: string): string | undefined;
export {};
