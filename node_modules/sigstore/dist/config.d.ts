import { DSSEBundleBuilder, IdentityProvider, MessageSignatureBundleBuilder } from '@sigstore/sign';
import { SignerFunc } from './types/signature';
import * as sigstore from './types/sigstore';
import type { FetchOptions, Retry } from './types/fetch';
import type { KeySelector } from './verify';
export type TUFOptions = {
    tufMirrorURL?: string;
    tufRootPath?: string;
    tufCachePath?: string;
} & FetchOptions;
export type SignOptions = {
    fulcioURL?: string;
    identityProvider?: IdentityProvider;
    identityToken?: string;
    oidcIssuer?: string;
    oidcClientID?: string;
    oidcClientSecret?: string;
    oidcRedirectURL?: string;
    rekorURL?: string;
    signer?: SignerFunc;
    tlogUpload?: boolean;
    tsaServerURL?: string;
} & FetchOptions;
export type VerifyOptions = {
    ctLogThreshold?: number;
    tlogThreshold?: number;
    certificateIssuer?: string;
    certificateIdentityEmail?: string;
    certificateIdentityURI?: string;
    certificateOIDs?: Record<string, string>;
    keySelector?: KeySelector;
    rekorURL?: string;
} & TUFOptions;
export type CreateVerifierOptions = {
    keySelector?: KeySelector;
} & TUFOptions;
export declare const DEFAULT_FULCIO_URL = "https://fulcio.sigstore.dev";
export declare const DEFAULT_REKOR_URL = "https://rekor.sigstore.dev";
export declare const DEFAULT_RETRY: Retry;
export declare const DEFAULT_TIMEOUT = 5000;
export type BundleType = 'messageSignature' | 'dsseEnvelope';
export declare function createBundleBuilder(bundleType: 'messageSignature', options: SignOptions): MessageSignatureBundleBuilder;
export declare function createBundleBuilder(bundleType: 'dsseEnvelope', options: SignOptions): DSSEBundleBuilder;
export declare function artifactVerificationOptions(options: VerifyOptions): sigstore.RequiredArtifactVerificationOptions;
