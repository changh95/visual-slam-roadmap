/// <reference types="node" resolution-mode="require"/>
import type { IncomingHttpHeaders } from 'node:http';
import type { Logger } from './logger/core.js';
type HeaderType = Headers | Record<string, any> | IncomingHttpHeaders;
type RequestBody = ArrayBuffer | Blob | ReadableStream | URLSearchParams | FormData;
export interface CreateRequestOptions {
    url: URL | string;
    clientAddress?: string | undefined;
    headers: HeaderType;
    method?: string;
    body?: RequestBody | undefined;
    logger: Logger;
    ssr: boolean;
    locals?: object | undefined;
}
export declare function createRequest({ url, headers, clientAddress, method, body, logger, ssr, locals, }: CreateRequestOptions): Request;
export {};
