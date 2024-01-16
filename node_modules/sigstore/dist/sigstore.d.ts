/// <reference types="node" />
import { SerializedBundle } from '@sigstore/bundle';
import * as tuf from '@sigstore/tuf';
import * as config from './config';
export declare function sign(payload: Buffer, options?: config.SignOptions): Promise<SerializedBundle>;
export declare function attest(payload: Buffer, payloadType: string, options?: config.SignOptions): Promise<SerializedBundle>;
export declare function verify(bundle: SerializedBundle, payload?: Buffer, options?: config.VerifyOptions): Promise<void>;
export interface BundleVerifier {
    verify(bundle: SerializedBundle): void;
}
export declare function createVerifier(options: config.CreateVerifierOptions): Promise<BundleVerifier>;
declare const tufUtils: {
    client: (options?: config.TUFOptions) => Promise<tuf.TUF>;
    getTarget: (path: string, options?: config.TUFOptions) => Promise<string>;
};
export { ValidationError } from '@sigstore/bundle';
export type { SerializedBundle as Bundle, SerializedEnvelope as Envelope, } from '@sigstore/bundle';
export type { TUF } from '@sigstore/tuf';
export type { SignOptions, VerifyOptions } from './config';
export { InternalError, PolicyError, VerificationError } from './error';
export * as utils from './sigstore-utils';
export { tufUtils as tuf };
export declare const DEFAULT_FULCIO_URL = "https://fulcio.sigstore.dev";
export declare const DEFAULT_REKOR_URL = "https://rekor.sigstore.dev";
