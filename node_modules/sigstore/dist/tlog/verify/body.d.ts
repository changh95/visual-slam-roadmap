import type { Bundle, TransparencyLogEntry } from '@sigstore/bundle';
export declare function verifyTLogBody(entry: TransparencyLogEntry, bundleContent: Bundle['content']): boolean;
