import type { TLogEntryWithInclusionProof } from '@sigstore/bundle';
import * as sigstore from '../../types/sigstore';
export declare function verifyCheckpoint(entry: TLogEntryWithInclusionProof, tlogs: sigstore.TransparencyLogInstance[]): boolean;
