/// <reference types="node" />
import { Signature, Signer } from '@sigstore/sign';
import { OneOf } from './utility';
interface VerificationMaterial {
    certificates: string[];
    key: {
        id?: string;
        value: string;
    };
}
export type SignatureMaterial = {
    signature: Buffer;
} & OneOf<VerificationMaterial>;
export type SignerFunc = (payload: Buffer) => Promise<SignatureMaterial>;
type CallbackSignerOptions = {
    signer: SignerFunc;
};
export declare class CallbackSigner implements Signer {
    private signer;
    constructor(options: CallbackSignerOptions);
    sign(data: Buffer): Promise<Signature>;
}
export {};
