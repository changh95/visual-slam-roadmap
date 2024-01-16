import type { Params, RedirectRouteData, RouteData, ValidRedirectStatus } from '../../@types/astro.js';
export declare function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData;
export declare function routeIsFallback(route: RouteData | undefined): route is RedirectRouteData;
export declare function redirectRouteGenerate(redirectRoute: RouteData, data: Params): string;
export declare function redirectRouteStatus(redirectRoute: RouteData, method?: string): ValidRedirectStatus;
