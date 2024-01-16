import type { ManifestData, RouteData } from '../../@types/astro.js';
/** Find matching route from pathname */
export declare function matchRoute(pathname: string, manifest: ManifestData): RouteData | undefined;
/** Finds all matching routes from pathname */
export declare function matchAllRoutes(pathname: string, manifest: ManifestData): RouteData[];
