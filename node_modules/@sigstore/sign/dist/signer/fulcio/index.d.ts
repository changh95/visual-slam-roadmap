/// <reference types="node" />
import { CAClientOptions } from './ca';
import type { IdentityProvider } from '../../identity';
import type { Signature, Signer } from '../signer';
export type FulcioSignerOptions = {
    identityProvider: IdentityProvider;
    keyHolder?: Signer;
} & CAClientOptions;
export declare class FulcioSigner implements Signer {
    private ca;
    private identityProvider;
    private keyHolder;
    constructor(options: FulcioSignerOptions);
    sign(data: Buffer): Promise<Signature>;
    private getIdentityToken;
}
