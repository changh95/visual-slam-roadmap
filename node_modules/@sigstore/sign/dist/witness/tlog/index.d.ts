import { TLogClientOptions } from './client';
import type { TransparencyLogEntry } from '@sigstore/bundle';
import type { SignatureBundle, Witness } from '../witness';
type TransparencyLogEntries = {
    tlogEntries: TransparencyLogEntry[];
};
export type RekorWitnessOptions = TLogClientOptions;
export declare class RekorWitness implements Witness {
    private tlog;
    constructor(options: RekorWitnessOptions);
    testify(content: SignatureBundle, publicKey: string): Promise<TransparencyLogEntries>;
}
export {};
