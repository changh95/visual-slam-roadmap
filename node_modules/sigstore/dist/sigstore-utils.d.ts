/// <reference types="node" />
import { SerializedBundle, SerializedEnvelope } from '@sigstore/bundle';
import { SignOptions } from './config';
import { SignerFunc } from './types/signature';
export declare function createDSSEEnvelope(payload: Buffer, payloadType: string, options: {
    signer: SignerFunc;
}): Promise<SerializedEnvelope>;
export declare function createRekorEntry(dsseEnvelope: SerializedEnvelope, publicKey: string, options?: SignOptions): Promise<SerializedBundle>;
