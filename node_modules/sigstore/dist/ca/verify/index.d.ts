import * as sigstore from '../../types/sigstore';
import type { BundleWithCertificateChain } from '@sigstore/bundle';
export declare function verifySigningCertificate(bundle: BundleWithCertificateChain, trustedRoot: sigstore.TrustedRoot, options: sigstore.CAArtifactVerificationOptions): void;
