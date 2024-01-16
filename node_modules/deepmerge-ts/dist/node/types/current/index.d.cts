/**
 * Flatten a complex type such as a union or intersection of objects into a
 * single object.
 */
type FlatternAlias<T> = Is<T, unknown> extends true ? T : {
    [P in keyof T]: T[P];
} & {};
/**
 * Get the value of the given key in the given object.
 */
type ValueOfKey<T extends Record<PropertyKey, unknown>, K extends PropertyKey> = K extends keyof T ? T[K] : never;
/**
 * Safely test whether or not the first given types extends the second.
 *
 * Needed in particular for testing if a type is "never".
 */
type Is<T1, T2> = [T1] extends [T2] ? true : false;
/**
 * Safely test whether or not the given type is "never".
 */
type IsNever<T> = Is<T, never>;
/**
 * Returns whether or not the given type a record.
 */
type IsRecord<T> = And<Not<IsNever<T>>, T extends Readonly<Record<PropertyKey, unknown>> ? true : false>;
/**
 * Returns whether or not all the given types are records.
 */
type EveryIsRecord<Ts extends ReadonlyArray<unknown>> = Ts extends readonly [infer Head, ...infer Rest] ? IsRecord<Head> extends true ? Rest extends ReadonlyArray<unknown> ? EveryIsRecord<Rest> : true : false : true;
/**
 * Returns whether or not the given type is an array.
 */
type IsArray<T> = And<Not<IsNever<T>>, T extends ReadonlyArray<unknown> ? true : false>;
/**
 * Returns whether or not all the given types are arrays.
 */
type EveryIsArray<Ts extends ReadonlyArray<unknown>> = Ts extends readonly [infer T1] ? IsArray<T1> : Ts extends readonly [infer Head, ...infer Rest] ? IsArray<Head> extends true ? Rest extends readonly [unknown, ...ReadonlyArray<unknown>] ? EveryIsArray<Rest> : false : false : false;
/**
 * Returns whether or not the given type is an set.
 *
 * Note: This may also return true for Maps.
 */
type IsSet<T> = And<Not<IsNever<T>>, T extends Readonly<ReadonlySet<unknown>> ? true : false>;
/**
 * Returns whether or not all the given types are sets.
 *
 * Note: This may also return true if all are maps.
 */
type EveryIsSet<Ts extends ReadonlyArray<unknown>> = Ts extends Readonly<readonly [infer T1]> ? IsSet<T1> : Ts extends readonly [infer Head, ...infer Rest] ? IsSet<Head> extends true ? Rest extends readonly [unknown, ...ReadonlyArray<unknown>] ? EveryIsSet<Rest> : false : false : false;
/**
 * Returns whether or not the given type is an map.
 */
type IsMap<T> = And<Not<IsNever<T>>, T extends Readonly<ReadonlyMap<unknown, unknown>> ? true : false>;
/**
 * Returns whether or not all the given types are maps.
 */
type EveryIsMap<Ts extends ReadonlyArray<unknown>> = Ts extends Readonly<readonly [infer T1]> ? IsMap<T1> : Ts extends readonly [infer Head, ...infer Rest] ? IsMap<Head> extends true ? Rest extends readonly [unknown, ...ReadonlyArray<unknown>] ? EveryIsMap<Rest> : false : false : false;
/**
 * And operator for types.
 */
type And<T1 extends boolean, T2 extends boolean> = T1 extends false ? false : T2;
/**
 * Not operator for types.
 */
type Not<T extends boolean> = T extends true ? false : true;
/**
 * Union of the sets' values' types
 */
type UnionSetValues<Ts extends ReadonlyArray<unknown>> = UnionSetValuesHelper<Ts, never>;
/**
 * Tail-recursive helper type for UnionSetValues.
 */
type UnionSetValuesHelper<Ts extends ReadonlyArray<unknown>, Acc> = Ts extends readonly [infer Head, ...infer Rest] ? Head extends Readonly<ReadonlySet<infer V1>> ? Rest extends ReadonlyArray<unknown> ? UnionSetValuesHelper<Rest, Acc | V1> : Acc | V1 : never : Acc;
/**
 * Union of the maps' values' types
 */
type UnionMapKeys<Ts extends ReadonlyArray<unknown>> = UnionMapKeysHelper<Ts, never>;
/**
 * Tail-recursive helper type for UnionMapKeys.
 */
type UnionMapKeysHelper<Ts extends ReadonlyArray<unknown>, Acc> = Ts extends readonly [infer Head, ...infer Rest] ? Head extends Readonly<ReadonlyMap<infer K1, unknown>> ? Rest extends readonly [] ? Acc | K1 : UnionMapKeysHelper<Rest, Acc | K1> : never : Acc;
/**
 * Union of the maps' keys' types
 */
type UnionMapValues<Ts extends ReadonlyArray<unknown>> = UnionMapValuesHelper<Ts, never>;
/**
 * Tail-recursive helper type for UnionMapValues.
 */
type UnionMapValuesHelper<Ts extends ReadonlyArray<unknown>, Acc> = Ts extends readonly [infer Head, ...infer Rest] ? Head extends Readonly<ReadonlyMap<unknown, infer V1>> ? Rest extends readonly [] ? Acc | V1 : UnionMapValuesHelper<Rest, Acc | V1> : never : Acc;
/**
 * Get the keys of the type what match a certain criteria.
 */
type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];
/**
 * Get the required keys of the type.
 */
type RequiredKeys<T> = Exclude<KeysOfType<T, Exclude<T[keyof T], undefined>>, undefined>;
/**
 * Get all the required keys on the types in the tuple.
 */
type RequiredKeysOf<Ts extends readonly [unknown, ...ReadonlyArray<unknown>]> = RequiredKeysOfHelper<Ts, never>;
/**
 * Tail-recursive helper type for RequiredKeysOf.
 */
type RequiredKeysOfHelper<Ts extends readonly [unknown, ...ReadonlyArray<unknown>], Acc> = Ts extends readonly [infer Head, ...infer Rest] ? Head extends Record<PropertyKey, unknown> ? Rest extends readonly [unknown, ...ReadonlyArray<unknown>] ? RequiredKeysOfHelper<Rest, Acc | RequiredKeys<Head>> : Acc | RequiredKeys<Head> : never : Acc;
/**
 * Get the optional keys of the type.
 */
type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;
/**
 * Get all the optional keys on the types in the tuple.
 */
type OptionalKeysOf<Ts extends readonly [unknown, ...ReadonlyArray<unknown>]> = OptionalKeysOfHelper<Ts, never>;
/**
 * Tail-recursive helper type for OptionalKeysOf.
 */
type OptionalKeysOfHelper<Ts extends readonly [unknown, ...ReadonlyArray<unknown>], Acc> = Ts extends readonly [infer Head, ...infer Rest] ? Head extends Record<PropertyKey, unknown> ? Rest extends readonly [unknown, ...ReadonlyArray<unknown>] ? OptionalKeysOfHelper<Rest, Acc | OptionalKeys<Head>> : Acc | OptionalKeys<Head> : never : Acc;
/**
 * Filter out nevers from a tuple.
 */
type FilterOutNever<T extends ReadonlyArray<unknown>> = FilterOutNeverHelper<T, []>;
/**
 * Tail-recursive helper type for FilterOutNever.
 */
type FilterOutNeverHelper<T extends ReadonlyArray<unknown>, Acc extends ReadonlyArray<unknown>> = T extends readonly [] ? Acc : T extends readonly [infer Head, ...infer Rest] ? IsNever<Head> extends true ? FilterOutNeverHelper<Rest, Acc> : FilterOutNeverHelper<Rest, [...Acc, Head]> : T;
/**
 * Is the type a tuple?
 */
type IsTuple<T extends ReadonlyArray<unknown>> = T extends readonly [] ? true : T extends readonly [unknown, ...ReadonlyArray<unknown>] ? true : false;

/**
 * Mapping of merge function URIs to the merge function type.
 */
interface DeepMergeMergeFunctionURItoKind<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, in out M> {
    readonly DeepMergeLeafURI: DeepMergeLeaf<Ts>;
    readonly DeepMergeRecordsDefaultURI: DeepMergeRecordsDefaultHKT<Ts, MF, M>;
    readonly DeepMergeArraysDefaultURI: DeepMergeArraysDefaultHKT<Ts, MF, M>;
    readonly DeepMergeSetsDefaultURI: DeepMergeSetsDefaultHKT<Ts>;
    readonly DeepMergeMapsDefaultURI: DeepMergeMapsDefaultHKT<Ts>;
}
/**
 * Get the type of the given merge function via its URI.
 */
type DeepMergeMergeFunctionKind<URI extends DeepMergeMergeFunctionURIs, Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = DeepMergeMergeFunctionURItoKind<Ts, MF, M>[URI];
/**
 * A union of all valid merge function URIs.
 */
type DeepMergeMergeFunctionURIs = keyof DeepMergeMergeFunctionURItoKind<ReadonlyArray<unknown>, DeepMergeMergeFunctionsURIs, unknown>;
/**
 * The merge functions to use when deep merging.
 */
type DeepMergeMergeFunctionsURIs = Readonly<{
    /**
     * The merge function to merge records with.
     */
    DeepMergeRecordsURI: DeepMergeMergeFunctionURIs;
    /**
     * The merge function to merge arrays with.
     */
    DeepMergeArraysURI: DeepMergeMergeFunctionURIs;
    /**
     * The merge function to merge sets with.
     */
    DeepMergeSetsURI: DeepMergeMergeFunctionURIs;
    /**
     * The merge function to merge maps with.
     */
    DeepMergeMapsURI: DeepMergeMergeFunctionURIs;
    /**
     * The merge function to merge other things with.
     */
    DeepMergeOthersURI: DeepMergeMergeFunctionURIs;
}>;
/**
 * Deep merge types.
 */
type DeepMergeHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = IsTuple<Ts> extends true ? Ts extends readonly [] ? undefined : Ts extends readonly [infer T1] ? T1 : EveryIsArray<Ts> extends true ? DeepMergeArraysHKT<Ts, MF, M> : EveryIsMap<Ts> extends true ? DeepMergeMapsHKT<Ts, MF, M> : EveryIsSet<Ts> extends true ? DeepMergeSetsHKT<Ts, MF, M> : EveryIsRecord<Ts> extends true ? DeepMergeRecordsHKT<Ts, MF, M> : DeepMergeOthersHKT<Ts, MF, M> : unknown;
/**
 * Deep merge records.
 */
type DeepMergeRecordsHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = DeepMergeMergeFunctionKind<MF["DeepMergeRecordsURI"], Ts, MF, M>;
/**
 * Deep merge arrays.
 */
type DeepMergeArraysHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = DeepMergeMergeFunctionKind<MF["DeepMergeArraysURI"], Ts, MF, M>;
/**
 * Deep merge sets.
 */
type DeepMergeSetsHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = DeepMergeMergeFunctionKind<MF["DeepMergeSetsURI"], Ts, MF, M>;
/**
 * Deep merge maps.
 */
type DeepMergeMapsHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = DeepMergeMergeFunctionKind<MF["DeepMergeMapsURI"], Ts, MF, M>;
/**
 * Deep merge other things.
 */
type DeepMergeOthersHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = DeepMergeMergeFunctionKind<MF["DeepMergeOthersURI"], Ts, MF, M>;
/**
 * The merge function that returns a leaf.
 */
type DeepMergeLeafURI = "DeepMergeLeafURI";
/**
 * Get the leaf type from many types that can't be merged.
 *
 * @deprecated Use `DeepMergeLeaf` instead.
 */
type DeepMergeLeafHKT<Ts extends ReadonlyArray<unknown>> = DeepMergeLeaf<Ts>;
/**
 * Get the leaf type from many types that can't be merged.
 */
type DeepMergeLeaf<Ts extends ReadonlyArray<unknown>> = Ts extends readonly [] ? never : Ts extends readonly [infer T] ? T : Ts extends readonly [...infer Rest, infer Tail] ? IsNever<Tail> extends true ? Rest extends ReadonlyArray<unknown> ? DeepMergeLeaf<Rest> : never : Tail : never;
/**
 * The meta data deepmerge is able to provide.
 */
type DeepMergeBuiltInMetaData = Readonly<{
    key: PropertyKey;
    parents: ReadonlyArray<Readonly<Record<PropertyKey, unknown>>>;
}>;

/**
 * The default merge function to merge records with.
 */
type DeepMergeRecordsDefaultURI = "DeepMergeRecordsDefaultURI";
/**
 * The default merge function to merge arrays with.
 */
type DeepMergeArraysDefaultURI = "DeepMergeArraysDefaultURI";
/**
 * The default merge function to merge sets with.
 */
type DeepMergeSetsDefaultURI = "DeepMergeSetsDefaultURI";
/**
 * The default merge function to merge maps with.
 */
type DeepMergeMapsDefaultURI = "DeepMergeMapsDefaultURI";
/**
 * The default merge functions to use when deep merging.
 */
type DeepMergeMergeFunctionsDefaultURIs = Readonly<{
    DeepMergeRecordsURI: DeepMergeRecordsDefaultURI;
    DeepMergeArraysURI: DeepMergeArraysDefaultURI;
    DeepMergeSetsURI: DeepMergeSetsDefaultURI;
    DeepMergeMapsURI: DeepMergeMapsDefaultURI;
    DeepMergeOthersURI: DeepMergeLeafURI;
}>;
/**
 * A union of all the props that should not be included in type information for
 * merged records.
 */
type BlacklistedRecordProps = "__proto__";
/**
 * Deep merge records.
 */
type DeepMergeRecordsDefaultHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = Ts extends Readonly<readonly [unknown, ...Readonly<ReadonlyArray<unknown>>]> ? FlatternAlias<Omit<DeepMergeRecordsDefaultHKTInternalProps<Ts, MF, M>, BlacklistedRecordProps>> : {};
/**
 * Deep merge record props.
 */
type DeepMergeRecordsDefaultHKTInternalProps<Ts extends readonly [unknown, ...ReadonlyArray<unknown>], MF extends DeepMergeMergeFunctionsURIs, M> = {
    [K in OptionalKeysOf<Ts>]?: DeepMergeHKT<DeepMergeRecordsDefaultHKTInternalPropValue<Ts, K, M>, MF, M>;
} & {
    [K in RequiredKeysOf<Ts>]: DeepMergeHKT<DeepMergeRecordsDefaultHKTInternalPropValue<Ts, K, M>, MF, M>;
};
/**
 * Get the value of the property.
 */
type DeepMergeRecordsDefaultHKTInternalPropValue<Ts extends readonly [unknown, ...ReadonlyArray<unknown>], K extends PropertyKey, M> = FilterOutNever<DeepMergeRecordsDefaultHKTInternalPropValueHelper<Ts, K, M, readonly []>>;
/**
 * Tail-recursive helper type for DeepMergeRecordsDefaultHKTInternalPropValue.
 */
type DeepMergeRecordsDefaultHKTInternalPropValueHelper<Ts extends readonly [unknown, ...ReadonlyArray<unknown>], K extends PropertyKey, M, Acc extends ReadonlyArray<unknown>> = Ts extends readonly [
    infer Head extends Readonly<Record<PropertyKey, unknown>>,
    ...infer Rest
] ? Rest extends readonly [unknown, ...ReadonlyArray<unknown>] ? DeepMergeRecordsDefaultHKTInternalPropValueHelper<Rest, K, M, [
    ...Acc,
    ValueOfKey<Head, K>
]> : [...Acc, ValueOfKey<Head, K>] : never;
/**
 * Deep merge 2 arrays.
 */
type DeepMergeArraysDefaultHKT<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M> = DeepMergeArraysDefaultHKTHelper<Ts, MF, M, []>;
/**
 * Tail-recursive helper type for DeepMergeArraysDefaultHKT.
 */
type DeepMergeArraysDefaultHKTHelper<Ts extends ReadonlyArray<unknown>, MF extends DeepMergeMergeFunctionsURIs, M, Acc extends ReadonlyArray<unknown>> = Ts extends readonly [
    infer Head extends ReadonlyArray<unknown>,
    ...infer Rest
] ? Rest extends readonly [
    ReadonlyArray<unknown>,
    ...ReadonlyArray<ReadonlyArray<unknown>>
] ? DeepMergeArraysDefaultHKTHelper<Rest, MF, M, [...Acc, ...Head]> : [...Acc, ...Head] : never;
/**
 * Deep merge 2 sets.
 */
type DeepMergeSetsDefaultHKT<Ts extends ReadonlyArray<unknown>> = Set<UnionSetValues<Ts>>;
/**
 * Deep merge 2 maps.
 */
type DeepMergeMapsDefaultHKT<Ts extends ReadonlyArray<unknown>> = Map<UnionMapKeys<Ts>, UnionMapValues<Ts>>;
/**
 * Get the merge functions with defaults apply from the given subset.
 */
type GetDeepMergeMergeFunctionsURIs<PMF extends Partial<DeepMergeMergeFunctionsURIs>> = Readonly<{
    DeepMergeRecordsURI: PMF["DeepMergeRecordsURI"] extends keyof DeepMergeMergeFunctionURItoKind<any, any, any> ? PMF["DeepMergeRecordsURI"] : DeepMergeRecordsDefaultURI;
    DeepMergeArraysURI: PMF["DeepMergeArraysURI"] extends keyof DeepMergeMergeFunctionURItoKind<any, any, any> ? PMF["DeepMergeArraysURI"] : DeepMergeArraysDefaultURI;
    DeepMergeSetsURI: PMF["DeepMergeSetsURI"] extends keyof DeepMergeMergeFunctionURItoKind<any, any, any> ? PMF["DeepMergeSetsURI"] : DeepMergeSetsDefaultURI;
    DeepMergeMapsURI: PMF["DeepMergeMapsURI"] extends keyof DeepMergeMergeFunctionURItoKind<any, any, any> ? PMF["DeepMergeMapsURI"] : DeepMergeMapsDefaultURI;
    DeepMergeOthersURI: PMF["DeepMergeOthersURI"] extends keyof DeepMergeMergeFunctionURItoKind<any, any, any> ? PMF["DeepMergeOthersURI"] : DeepMergeLeafURI;
}>;

/**
 * The default merge functions.
 */
type MergeFunctions$1 = {
    mergeRecords: typeof mergeRecords$1;
    mergeArrays: typeof mergeArrays$1;
    mergeSets: typeof mergeSets$1;
    mergeMaps: typeof mergeMaps$1;
    mergeOthers: typeof mergeOthers$1;
};
/**
 * The default strategy to merge records into a target record.
 *
 * @param m_target - The result will be mutated into this record
 * @param values - The records (including the target's value if there is one).
 */
declare function mergeRecords$1<Ts extends ReadonlyArray<Record<PropertyKey, unknown>>, U extends DeepMergeMergeIntoFunctionUtils<M, MM>, M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData>(m_target: Reference<Record<PropertyKey, unknown>>, values: Ts, utils: U, meta: M | undefined): void;
/**
 * The default strategy to merge arrays into a target array.
 *
 * @param m_target - The result will be mutated into this array
 * @param values - The arrays (including the target's value if there is one).
 */
declare function mergeArrays$1<Ts extends ReadonlyArray<ReadonlyArray<unknown>>>(m_target: Reference<unknown[]>, values: Ts): void;
/**
 * The default strategy to merge sets into a target set.
 *
 * @param m_target - The result will be mutated into this set
 * @param values - The sets (including the target's value if there is one).
 */
declare function mergeSets$1<Ts extends ReadonlyArray<Readonly<ReadonlySet<unknown>>>>(m_target: Reference<Set<unknown>>, values: Ts): void;
/**
 * The default strategy to merge maps into a target map.
 *
 * @param m_target - The result will be mutated into this map
 * @param values - The maps (including the target's value if there is one).
 */
declare function mergeMaps$1<Ts extends ReadonlyArray<Readonly<ReadonlyMap<unknown, unknown>>>>(m_target: Reference<Map<unknown, unknown>>, values: Ts): void;
/**
 * Set the target to the last value.
 */
declare function mergeOthers$1<Ts extends ReadonlyArray<unknown>>(m_target: Reference<unknown>, values: Ts): void;

/**
 * The default merge functions.
 */
type MergeFunctions = {
    mergeRecords: typeof mergeRecords;
    mergeArrays: typeof mergeArrays;
    mergeSets: typeof mergeSets;
    mergeMaps: typeof mergeMaps;
    mergeOthers: typeof mergeOthers;
};
/**
 * The default strategy to merge records.
 *
 * @param values - The records.
 */
declare function mergeRecords<Ts extends ReadonlyArray<Record<PropertyKey, unknown>>, U extends DeepMergeMergeFunctionUtils<M, MM>, MF extends DeepMergeMergeFunctionsURIs, M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData>(values: Ts, utils: U, meta: M | undefined): DeepMergeRecordsDefaultHKT<Ts, MF, M>;
/**
 * The default strategy to merge arrays.
 *
 * @param values - The arrays.
 */
declare function mergeArrays<Ts extends ReadonlyArray<ReadonlyArray<unknown>>, MF extends DeepMergeMergeFunctionsURIs, M>(values: Ts): DeepMergeArraysDefaultHKT<Ts, MF, M>;
/**
 * The default strategy to merge sets.
 *
 * @param values - The sets.
 */
declare function mergeSets<Ts extends ReadonlyArray<Readonly<ReadonlySet<unknown>>>>(values: Ts): DeepMergeSetsDefaultHKT<Ts>;
/**
 * The default strategy to merge maps.
 *
 * @param values - The maps.
 */
declare function mergeMaps<Ts extends ReadonlyArray<Readonly<ReadonlyMap<unknown, unknown>>>>(values: Ts): DeepMergeMapsDefaultHKT<Ts>;
/**
 * Get the last value in the given array.
 */
declare function mergeOthers<Ts extends ReadonlyArray<unknown>>(values: Ts): unknown;

/**
 * The options the user can pass to customize deepmerge.
 */
type DeepMergeOptions<in out M, MM extends Readonly<Record<PropertyKey, unknown>> = {}> = Partial<DeepMergeOptionsFull<M, MM & DeepMergeBuiltInMetaData>>;
/**
 * The options the user can pass to customize deepmergeInto.
 */
type DeepMergeIntoOptions<in out M, MM extends Readonly<Record<PropertyKey, unknown>> = {}> = Partial<DeepMergeIntoOptionsFull<M, MM & DeepMergeBuiltInMetaData>>;
type MetaDataUpdater<in out M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData> = (previousMeta: M | undefined, metaMeta: Readonly<Partial<MM>>) => M;
/**
 * All the options the user can pass to customize deepmerge.
 */
type DeepMergeOptionsFull<in out M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData> = Readonly<{
    mergeRecords: DeepMergeMergeFunctions<M, MM>["mergeRecords"] | false;
    mergeArrays: DeepMergeMergeFunctions<M, MM>["mergeArrays"] | false;
    mergeMaps: DeepMergeMergeFunctions<M, MM>["mergeMaps"] | false;
    mergeSets: DeepMergeMergeFunctions<M, MM>["mergeSets"] | false;
    mergeOthers: DeepMergeMergeFunctions<M, MM>["mergeOthers"];
    metaDataUpdater: MetaDataUpdater<M, MM>;
    enableImplicitDefaultMerging: boolean;
}>;
/**
 * All the options the user can pass to customize deepmergeInto.
 */
type DeepMergeIntoOptionsFull<in out M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData> = Readonly<{
    mergeRecords: DeepMergeMergeIntoFunctions<M, MM>["mergeRecords"] | false;
    mergeArrays: DeepMergeMergeIntoFunctions<M, MM>["mergeArrays"] | false;
    mergeMaps: DeepMergeMergeIntoFunctions<M, MM>["mergeMaps"] | false;
    mergeSets: DeepMergeMergeIntoFunctions<M, MM>["mergeSets"] | false;
    mergeOthers: DeepMergeMergeIntoFunctions<M, MM>["mergeOthers"];
    metaDataUpdater: MetaDataUpdater<M, MM>;
}>;
/**
 * An object that has a reference to a value.
 */
type Reference<T> = {
    value: T;
};
/**
 * All the merge functions that deepmerge uses.
 */
type DeepMergeMergeFunctions<in M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData> = Readonly<{
    mergeRecords: <Ts extends ReadonlyArray<Readonly<Record<PropertyKey, unknown>>>, U extends DeepMergeMergeFunctionUtils<M, MM>>(values: Ts, utils: U, meta: M | undefined) => unknown;
    mergeArrays: <Ts extends ReadonlyArray<ReadonlyArray<unknown>>, U extends DeepMergeMergeFunctionUtils<M, MM>>(values: Ts, utils: U, meta: M | undefined) => unknown;
    mergeMaps: <Ts extends ReadonlyArray<Readonly<ReadonlyMap<unknown, unknown>>>, U extends DeepMergeMergeFunctionUtils<M, MM>>(values: Ts, utils: U, meta: M | undefined) => unknown;
    mergeSets: <Ts extends ReadonlyArray<Readonly<ReadonlySet<unknown>>>, U extends DeepMergeMergeFunctionUtils<M, MM>>(values: Ts, utils: U, meta: M | undefined) => unknown;
    mergeOthers: <Ts extends ReadonlyArray<unknown>, U extends DeepMergeMergeFunctionUtils<M, MM>>(values: Ts, utils: U, meta: M | undefined) => unknown;
}>;
type DeepMergeMergeIntoFunctionsReturnType = void | symbol;
/**
 * All the merge functions that deepmerge uses.
 */
type DeepMergeMergeIntoFunctions<in M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData> = Readonly<{
    mergeRecords: <Ts extends ReadonlyArray<Readonly<Record<PropertyKey, unknown>>>, U extends DeepMergeMergeIntoFunctionUtils<M, MM>>(m_target: Reference<Record<PropertyKey, unknown>>, values: Ts, utils: U, meta: M | undefined) => DeepMergeMergeIntoFunctionsReturnType;
    mergeArrays: <Ts extends ReadonlyArray<ReadonlyArray<unknown>>, U extends DeepMergeMergeIntoFunctionUtils<M, MM>>(m_target: Reference<unknown[]>, values: Ts, utils: U, meta: M | undefined) => DeepMergeMergeIntoFunctionsReturnType;
    mergeMaps: <Ts extends ReadonlyArray<Readonly<ReadonlyMap<unknown, unknown>>>, U extends DeepMergeMergeIntoFunctionUtils<M, MM>>(m_target: Reference<Map<unknown, unknown>>, values: Ts, utils: U, meta: M | undefined) => DeepMergeMergeIntoFunctionsReturnType;
    mergeSets: <Ts extends ReadonlyArray<Readonly<ReadonlySet<unknown>>>, U extends DeepMergeMergeIntoFunctionUtils<M, MM>>(m_target: Reference<Set<unknown>>, values: Ts, utils: U, meta: M | undefined) => DeepMergeMergeIntoFunctionsReturnType;
    mergeOthers: <Ts extends ReadonlyArray<unknown>, U extends DeepMergeMergeIntoFunctionUtils<M, MM>>(m_target: Reference<unknown>, values: Ts, utils: U, meta: M | undefined) => DeepMergeMergeIntoFunctionsReturnType;
}>;
/**
 * The utils provided to the merge functions.
 */
type DeepMergeMergeFunctionUtils<in out M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData> = Readonly<{
    mergeFunctions: DeepMergeMergeFunctions<M, MM>;
    defaultMergeFunctions: MergeFunctions;
    metaDataUpdater: MetaDataUpdater<M, MM>;
    deepmerge: <Ts extends ReadonlyArray<unknown>>(...values: Ts) => unknown;
    useImplicitDefaultMerging: boolean;
    actions: Readonly<{
        defaultMerge: symbol;
        skip: symbol;
    }>;
}>;
/**
 * The utils provided to the merge functions.
 */
type DeepMergeMergeIntoFunctionUtils<in out M, MM extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData> = Readonly<{
    mergeFunctions: DeepMergeMergeIntoFunctions<M, MM>;
    defaultMergeFunctions: MergeFunctions$1;
    metaDataUpdater: MetaDataUpdater<M, MM>;
    deepmergeInto: <Target extends object, Ts extends ReadonlyArray<unknown>>(target: Target, ...values: Ts) => void;
    actions: Readonly<{
        defaultMerge: symbol;
    }>;
}>;

/**
 * Deeply merge objects.
 *
 * @param objects - The objects to merge.
 */
declare function deepmerge<Ts extends Readonly<ReadonlyArray<unknown>>>(...objects: readonly [...Ts]): DeepMergeHKT<Ts, DeepMergeMergeFunctionsDefaultURIs, DeepMergeBuiltInMetaData>;
/**
 * Deeply merge two or more objects using the given options.
 *
 * @param options - The options on how to customize the merge function.
 */
declare function deepmergeCustom<PMF extends Partial<DeepMergeMergeFunctionsURIs>>(options: DeepMergeOptions<DeepMergeBuiltInMetaData, DeepMergeBuiltInMetaData>): <Ts extends ReadonlyArray<unknown>>(...objects: Ts) => DeepMergeHKT<Ts, GetDeepMergeMergeFunctionsURIs<PMF>, DeepMergeBuiltInMetaData>;
/**
 * Deeply merge two or more objects using the given options and meta data.
 *
 * @param options - The options on how to customize the merge function.
 * @param rootMetaData - The meta data passed to the root items' being merged.
 */
declare function deepmergeCustom<PMF extends Partial<DeepMergeMergeFunctionsURIs>, MetaData, MetaMetaData extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData>(options: DeepMergeOptions<MetaData, MetaMetaData>, rootMetaData?: MetaData): <Ts extends ReadonlyArray<unknown>>(...objects: Ts) => DeepMergeHKT<Ts, GetDeepMergeMergeFunctionsURIs<PMF>, MetaData>;

/**
 * Deeply merge objects into a target.
 *
 * @param target - This object will be mutated with the merge result.
 * @param objects - The objects to merge into the target.
 */
declare function deepmergeInto<T extends object>(target: T, ...objects: ReadonlyArray<T>): void;
/**
 * Deeply merge objects into a target.
 *
 * @param target - This object will be mutated with the merge result.
 * @param objects - The objects to merge into the target.
 */
declare function deepmergeInto<Target extends object, Ts extends ReadonlyArray<unknown>>(target: Target, ...objects: Ts): asserts target is FlatternAlias<Target & DeepMergeHKT<[
    Target,
    ...Ts
], DeepMergeMergeFunctionsDefaultURIs, DeepMergeBuiltInMetaData>>;
/**
 * Deeply merge two or more objects using the given options.
 *
 * @param options - The options on how to customize the merge function.
 */
declare function deepmergeIntoCustom(options: DeepMergeIntoOptions<DeepMergeBuiltInMetaData, DeepMergeBuiltInMetaData>): <Target extends object, Ts extends ReadonlyArray<unknown>>(target: Target, ...objects: Ts) => void;
/**
 * Deeply merge two or more objects using the given options and meta data.
 *
 * @param options - The options on how to customize the merge function.
 * @param rootMetaData - The meta data passed to the root items' being merged.
 */
declare function deepmergeIntoCustom<MetaData, MetaMetaData extends DeepMergeBuiltInMetaData = DeepMergeBuiltInMetaData>(options: DeepMergeIntoOptions<MetaData, MetaMetaData>, rootMetaData?: MetaData): <Target extends object, Ts extends ReadonlyArray<unknown>>(target: Target, ...objects: Ts) => void;

/**
 * The different types of objects deepmerge-ts support.
 */
declare const enum ObjectType {
    NOT = 0,
    RECORD = 1,
    ARRAY = 2,
    SET = 3,
    MAP = 4,
    OTHER = 5
}
/**
 * Get the type of the given object.
 *
 * @param object - The object to get the type of.
 * @returns The type of the given object.
 */
declare function getObjectType(object: unknown): ObjectType;
/**
 * Get the keys of the given objects including symbol keys.
 *
 * Note: Only keys to enumerable properties are returned.
 *
 * @param objects - An array of objects to get the keys of.
 * @returns A set containing all the keys of all the given objects.
 */
declare function getKeys(objects: ReadonlyArray<object>): Set<PropertyKey>;
/**
 * Does the given object have the given property.
 *
 * @param object - The object to test.
 * @param property - The property to test.
 * @returns Whether the object has the property.
 */
declare function objectHasProperty(object: object, property: PropertyKey): boolean;

export { DeepMergeArraysDefaultHKT, DeepMergeBuiltInMetaData, DeepMergeHKT, DeepMergeIntoOptions, DeepMergeLeaf, DeepMergeLeafHKT, DeepMergeLeafURI, DeepMergeMapsDefaultHKT, DeepMergeMergeFunctionURItoKind, DeepMergeMergeFunctionUtils, DeepMergeMergeFunctionsDefaultURIs, MergeFunctions as DeepMergeMergeFunctionsDefaults, DeepMergeMergeFunctionsURIs, DeepMergeMergeIntoFunctionUtils, MergeFunctions$1 as DeepMergeMergeIntoFunctionsDefaults, DeepMergeOptions, DeepMergeRecordsDefaultHKT, DeepMergeSetsDefaultHKT, Reference as DeepMergeValueReference, GetDeepMergeMergeFunctionsURIs, ObjectType, deepmerge, deepmergeCustom, deepmergeInto, deepmergeIntoCustom, getKeys, getObjectType, objectHasProperty };
