import { Index } from '../types/IndexType';
/** Filters an object by a predicate. */
declare const filterObject: <T>(obj: Index<T>, predicate: (key: string, value: T) => boolean) => Index<T>;
export default filterObject;
