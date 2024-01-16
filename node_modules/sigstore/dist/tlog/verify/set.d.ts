import * as sigstore from '../../types/sigstore';
import type { TLogEntryWithInclusionPromise } from '@sigstore/bundle';
export declare function verifyTLogSET(entry: TLogEntryWithInclusionPromise, tlogs: sigstore.TransparencyLogInstance[]): boolean;
