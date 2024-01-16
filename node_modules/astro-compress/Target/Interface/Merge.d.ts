/**
 * @module Merge
 *
 * Represents a generic interface for deep merging objects using merge functions defined in DeepMergeMergeFunctionsURIs.
 *
 * @template PMF - A type parameter representing Partial<DeepMergeMergeFunctionsURIs>.
 *
 */
export default interface Type<PMF extends Partial<DeepMergeMergeFunctionsURIs>> {
    /**
     * Merges multiple objects of type Ts using the provided merge functions and built-in metadata.
     *
     * @param ...Objects - An arbitrary number of objects to be merged.
     *
     */
    <Ts extends readonly unknown[]>(...Objects: Ts): DeepMergeHKT<Ts, GetDeepMergeMergeFunctionsURIs<PMF>, DeepMergeBuiltInMetaData>;
}
export interface Generic {
    DeepMergeArraysURI: DeepMergeLeafURI;
}
import type { DeepMergeBuiltInMetaData, DeepMergeHKT, DeepMergeLeafURI, DeepMergeMergeFunctionsURIs, GetDeepMergeMergeFunctionsURIs } from "deepmerge-ts";
