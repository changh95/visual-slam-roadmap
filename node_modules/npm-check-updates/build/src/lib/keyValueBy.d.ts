import { Index } from '../types/IndexType';
type KeyValueGenerator<K, V, R> = (key: K, value: V, accum: Index<R>) => Index<R> | null;
export declare function keyValueBy<T>(arr: T[]): Index<true>;
export declare function keyValueBy<T, R>(arr: T[], keyValue: KeyValueGenerator<T, number, R>, initialValue?: Index<R>): Index<R>;
export declare function keyValueBy<T, R>(obj: Index<T>, keyValue: KeyValueGenerator<string, T, R>, initialValue?: Index<R>): Index<R>;
export default keyValueBy;
