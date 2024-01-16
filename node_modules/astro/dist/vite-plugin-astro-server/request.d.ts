/// <reference types="node" resolution-mode="require"/>
import type http from 'node:http';
import type { ManifestData, SSRManifest } from '../@types/astro.js';
import type { DevServerController } from './controller.js';
import type DevPipeline from './devPipeline.js';
type HandleRequest = {
    pipeline: DevPipeline;
    manifestData: ManifestData;
    controller: DevServerController;
    incomingRequest: http.IncomingMessage;
    incomingResponse: http.ServerResponse;
    manifest: SSRManifest;
};
/** The main logic to route dev server requests to pages in Astro. */
export declare function handleRequest({ pipeline, manifestData, controller, incomingRequest, incomingResponse, manifest, }: HandleRequest): Promise<void>;
export {};
