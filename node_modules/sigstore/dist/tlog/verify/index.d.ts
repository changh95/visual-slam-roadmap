import { Bundle } from '@sigstore/bundle';
import * as sigstore from '../../types/sigstore';
export declare function verifyTLogEntries(bundle: Bundle, trustedRoot: sigstore.TrustedRoot, options: sigstore.ArtifactVerificationOptions_TlogOptions): void;
