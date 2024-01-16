/// <reference types="node" />
import { Artifact, BaseBundleBuilder, BundleBuilderOptions } from './base';
import type { BundleWithDsseEnvelope } from '@sigstore/bundle';
import type { Signature } from '../signer';
export declare class DSSEBundleBuilder extends BaseBundleBuilder<BundleWithDsseEnvelope> {
    constructor(options: BundleBuilderOptions);
    protected prepare(artifact: Artifact): Promise<Buffer>;
    protected package(artifact: Artifact, signature: Signature): Promise<BundleWithDsseEnvelope>;
}
