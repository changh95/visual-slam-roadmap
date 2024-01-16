import { Pipeline } from '../pipeline.js';
import type { Environment } from '../render/index.js';
/**
 * Thrown when an endpoint contains a response with the header "X-Astro-Response" === 'Not-Found'
 */
export declare class EndpointNotFoundError extends Error {
    originalResponse: Response;
    constructor(originalResponse: Response);
}
export declare class SSRRoutePipeline extends Pipeline {
    #private;
    constructor(env: Environment);
}
