/// <reference types="node" resolution-mode="require"/>
import type http from 'node:http';
import type { ComponentInstance, ManifestData, RouteData, SSRManifest } from '../@types/astro.js';
import type DevPipeline from './devPipeline.js';
type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;
export interface MatchedRoute {
    route: RouteData;
    filePath: URL;
    resolvedPathname: string;
    preloadedComponent: ComponentInstance;
    mod: ComponentInstance;
}
export declare function matchRoute(pathname: string, manifestData: ManifestData, pipeline: DevPipeline): Promise<MatchedRoute | undefined>;
type HandleRoute = {
    matchedRoute: AsyncReturnType<typeof matchRoute>;
    url: URL;
    pathname: string;
    body: ArrayBuffer | undefined;
    origin: string;
    manifestData: ManifestData;
    incomingRequest: http.IncomingMessage;
    incomingResponse: http.ServerResponse;
    manifest: SSRManifest;
    status?: 404 | 500;
    pipeline: DevPipeline;
};
export declare function handleRoute({ matchedRoute, url, pathname, status, body, origin, pipeline, manifestData, incomingRequest, incomingResponse, manifest, }: HandleRoute): Promise<void>;
export {};
