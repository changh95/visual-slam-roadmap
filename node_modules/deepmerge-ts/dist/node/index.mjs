/**
 * Special values that tell deepmerge to perform a certain action.
 */
const actions = {
    defaultMerge: Symbol("deepmerge-ts: default merge"),
    skip: Symbol("deepmerge-ts: skip"),
};
/**
 * Special values that tell deepmergeInto to perform a certain action.
 */
const actionsInto = {
    defaultMerge: actions.defaultMerge,
};

/**
 * The default function to update meta data.
 */
function defaultMetaDataUpdater(previousMeta, metaMeta) {
    return metaMeta;
}

/**
 * Get the type of the given object.
 *
 * @param object - The object to get the type of.
 * @returns The type of the given object.
 */
function getObjectType(object) {
    if (typeof object !== "object" || object === null) {
        return 0 /* ObjectType.NOT */;
    }
    if (Array.isArray(object)) {
        return 2 /* ObjectType.ARRAY */;
    }
    if (isRecord(object)) {
        return 1 /* ObjectType.RECORD */;
    }
    if (object instanceof Set) {
        return 3 /* ObjectType.SET */;
    }
    if (object instanceof Map) {
        return 4 /* ObjectType.MAP */;
    }
    return 5 /* ObjectType.OTHER */;
}
/**
 * Get the keys of the given objects including symbol keys.
 *
 * Note: Only keys to enumerable properties are returned.
 *
 * @param objects - An array of objects to get the keys of.
 * @returns A set containing all the keys of all the given objects.
 */
function getKeys(objects) {
    const keys = new Set();
    /* eslint-disable functional/no-loop-statements, functional/no-expression-statements -- using a loop here is more efficient. */
    for (const object of objects) {
        for (const key of [
            ...Object.keys(object),
            ...Object.getOwnPropertySymbols(object),
        ]) {
            keys.add(key);
        }
    }
    /* eslint-enable functional/no-loop-statements, functional/no-expression-statements */
    return keys;
}
/**
 * Does the given object have the given property.
 *
 * @param object - The object to test.
 * @param property - The property to test.
 * @returns Whether the object has the property.
 */
function objectHasProperty(object, property) {
    return (typeof object === "object" &&
        Object.prototype.propertyIsEnumerable.call(object, property));
}
/**
 * Get an iterable object that iterates over the given iterables.
 */
function getIterableOfIterables(iterables) {
    return {
        // eslint-disable-next-line functional/functional-parameters
        *[Symbol.iterator]() {
            // eslint-disable-next-line functional/no-loop-statements
            for (const iterable of iterables) {
                // eslint-disable-next-line functional/no-loop-statements
                for (const value of iterable) {
                    yield value;
                }
            }
        },
    };
}
const validRecordToStringValues = new Set([
    "[object Object]",
    "[object Module]",
]);
/**
 * Does the given object appear to be a record.
 */
function isRecord(value) {
    // All records are objects.
    if (!validRecordToStringValues.has(Object.prototype.toString.call(value))) {
        return false;
    }
    const { constructor } = value;
    // If has modified constructor.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (constructor === undefined) {
        return true;
    }
    // eslint-disable-next-line prefer-destructuring
    const prototype = constructor.prototype;
    // If has modified prototype.
    if (prototype === null ||
        typeof prototype !== "object" ||
        !validRecordToStringValues.has(Object.prototype.toString.call(prototype))) {
        return false;
    }
    // If constructor does not have an Object-specific method.
    // eslint-disable-next-line sonarjs/prefer-single-boolean-return, no-prototype-builtins
    if (!prototype.hasOwnProperty("isPrototypeOf")) {
        return false;
    }
    // Most likely a record.
    return true;
}

/**
 * The default strategy to merge records.
 *
 * @param values - The records.
 */
function mergeRecords$2(values, utils, meta) {
    const result = {};
    /* eslint-disable functional/no-loop-statements, functional/no-conditional-statements, functional/no-expression-statements, functional/immutable-data -- using imperative code here is more performant. */
    for (const key of getKeys(values)) {
        const propValues = [];
        for (const value of values) {
            if (objectHasProperty(value, key)) {
                propValues.push(value[key]);
            }
        }
        if (propValues.length === 0) {
            continue;
        }
        const updatedMeta = utils.metaDataUpdater(meta, {
            key,
            parents: values,
        });
        const propertyResult = mergeUnknowns(propValues, utils, updatedMeta);
        if (propertyResult === actions.skip) {
            continue;
        }
        if (key === "__proto__") {
            Object.defineProperty(result, key, {
                value: propertyResult,
                configurable: true,
                enumerable: true,
                writable: true,
            });
        }
        else {
            result[key] = propertyResult;
        }
    }
    /* eslint-enable functional/no-loop-statements, functional/no-conditional-statements, functional/no-expression-statements, functional/immutable-data */
    return result;
}
/**
 * The default strategy to merge arrays.
 *
 * @param values - The arrays.
 */
function mergeArrays$2(values) {
    return values.flat();
}
/**
 * The default strategy to merge sets.
 *
 * @param values - The sets.
 */
function mergeSets$2(values) {
    return new Set(getIterableOfIterables(values));
}
/**
 * The default strategy to merge maps.
 *
 * @param values - The maps.
 */
function mergeMaps$2(values) {
    return new Map(getIterableOfIterables(values));
}
/**
 * Get the last value in the given array.
 */
function mergeOthers$2(values) {
    return values.at(-1);
}

var defaultMergeFunctions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mergeArrays: mergeArrays$2,
    mergeMaps: mergeMaps$2,
    mergeOthers: mergeOthers$2,
    mergeRecords: mergeRecords$2,
    mergeSets: mergeSets$2
});

/**
 * Deeply merge objects.
 *
 * @param objects - The objects to merge.
 */
function deepmerge(
// eslint-disable-next-line functional/functional-parameters
...objects) {
    return deepmergeCustom({})(...objects);
}
function deepmergeCustom(options, rootMetaData) {
    const utils = getUtils(options, customizedDeepmerge);
    /**
     * The customized deepmerge function.
     */
    function customizedDeepmerge(
    // eslint-disable-next-line functional/functional-parameters
    ...objects) {
        return mergeUnknowns(objects, utils, rootMetaData);
    }
    return customizedDeepmerge;
}
/**
 * The the utils that are available to the merge functions.
 *
 * @param options - The options the user specified
 */
function getUtils(options, customizedDeepmerge) {
    return {
        defaultMergeFunctions,
        mergeFunctions: {
            ...defaultMergeFunctions,
            ...Object.fromEntries(Object.entries(options)
                .filter(([key, option]) => Object.hasOwn(defaultMergeFunctions, key))
                .map(([key, option]) => option === false
                ? [key, mergeOthers$2]
                : [key, option])),
        },
        metaDataUpdater: (options.metaDataUpdater ??
            defaultMetaDataUpdater),
        deepmerge: customizedDeepmerge,
        useImplicitDefaultMerging: options.enableImplicitDefaultMerging ?? false,
        actions,
    };
}
/**
 * Merge unknown things.
 *
 * @param values - The values.
 */
function mergeUnknowns(values, utils, meta) {
    if (values.length === 0) {
        return undefined;
    }
    if (values.length === 1) {
        return mergeOthers$1(values, utils, meta);
    }
    const type = getObjectType(values[0]);
    /* eslint-disable functional/no-loop-statements, functional/no-conditional-statements -- using imperative code here is more performant. */
    if (type !== 0 /* ObjectType.NOT */ && type !== 5 /* ObjectType.OTHER */) {
        for (let m_index = 1; m_index < values.length; m_index++) {
            if (getObjectType(values[m_index]) === type) {
                continue;
            }
            return mergeOthers$1(values, utils, meta);
        }
    }
    /* eslint-enable functional/no-loop-statements, functional/no-conditional-statements */
    switch (type) {
        case 1 /* ObjectType.RECORD */: {
            return mergeRecords$1(values, utils, meta);
        }
        case 2 /* ObjectType.ARRAY */: {
            return mergeArrays$1(values, utils, meta);
        }
        case 3 /* ObjectType.SET */: {
            return mergeSets$1(values, utils, meta);
        }
        case 4 /* ObjectType.MAP */: {
            return mergeMaps$1(values, utils, meta);
        }
        default: {
            return mergeOthers$1(values, utils, meta);
        }
    }
}
/**
 * Merge records.
 *
 * @param values - The records.
 */
function mergeRecords$1(values, utils, meta) {
    const result = utils.mergeFunctions.mergeRecords(values, utils, meta);
    if (result === actions.defaultMerge ||
        (utils.useImplicitDefaultMerging &&
            result === undefined &&
            utils.mergeFunctions.mergeRecords !==
                utils.defaultMergeFunctions.mergeRecords)) {
        return utils.defaultMergeFunctions.mergeRecords(values, utils, meta);
    }
    return result;
}
/**
 * Merge arrays.
 *
 * @param values - The arrays.
 */
function mergeArrays$1(values, utils, meta) {
    const result = utils.mergeFunctions.mergeArrays(values, utils, meta);
    if (result === actions.defaultMerge ||
        (utils.useImplicitDefaultMerging &&
            result === undefined &&
            utils.mergeFunctions.mergeArrays !==
                utils.defaultMergeFunctions.mergeArrays)) {
        return utils.defaultMergeFunctions.mergeArrays(values);
    }
    return result;
}
/**
 * Merge sets.
 *
 * @param values - The sets.
 */
function mergeSets$1(values, utils, meta) {
    const result = utils.mergeFunctions.mergeSets(values, utils, meta);
    if (result === actions.defaultMerge ||
        (utils.useImplicitDefaultMerging &&
            result === undefined &&
            utils.mergeFunctions.mergeSets !== utils.defaultMergeFunctions.mergeSets)) {
        return utils.defaultMergeFunctions.mergeSets(values);
    }
    return result;
}
/**
 * Merge maps.
 *
 * @param values - The maps.
 */
function mergeMaps$1(values, utils, meta) {
    const result = utils.mergeFunctions.mergeMaps(values, utils, meta);
    if (result === actions.defaultMerge ||
        (utils.useImplicitDefaultMerging &&
            result === undefined &&
            utils.mergeFunctions.mergeMaps !== utils.defaultMergeFunctions.mergeMaps)) {
        return utils.defaultMergeFunctions.mergeMaps(values);
    }
    return result;
}
/**
 * Merge other things.
 *
 * @param values - The other things.
 */
function mergeOthers$1(values, utils, meta) {
    const result = utils.mergeFunctions.mergeOthers(values, utils, meta);
    if (result === actions.defaultMerge ||
        (utils.useImplicitDefaultMerging &&
            result === undefined &&
            utils.mergeFunctions.mergeOthers !==
                utils.defaultMergeFunctions.mergeOthers)) {
        return utils.defaultMergeFunctions.mergeOthers(values);
    }
    return result;
}

/**
 * The default strategy to merge records into a target record.
 *
 * @param m_target - The result will be mutated into this record
 * @param values - The records (including the target's value if there is one).
 */
function mergeRecords(m_target, values, utils, meta) {
    for (const key of getKeys(values)) {
        const propValues = [];
        for (const value of values) {
            if (objectHasProperty(value, key)) {
                propValues.push(value[key]);
            }
        }
        if (propValues.length === 0) {
            continue;
        }
        const updatedMeta = utils.metaDataUpdater(meta, {
            key,
            parents: values,
        });
        const propertyTarget = { value: propValues[0] };
        mergeUnknownsInto(propertyTarget, propValues, utils, updatedMeta);
        if (key === "__proto__") {
            Object.defineProperty(m_target, key, {
                value: propertyTarget.value,
                configurable: true,
                enumerable: true,
                writable: true,
            });
        }
        else {
            m_target.value[key] = propertyTarget.value;
        }
    }
}
/**
 * The default strategy to merge arrays into a target array.
 *
 * @param m_target - The result will be mutated into this array
 * @param values - The arrays (including the target's value if there is one).
 */
function mergeArrays(m_target, values) {
    m_target.value.push(...values.slice(1).flat());
}
/**
 * The default strategy to merge sets into a target set.
 *
 * @param m_target - The result will be mutated into this set
 * @param values - The sets (including the target's value if there is one).
 */
function mergeSets(m_target, values) {
    for (const value of getIterableOfIterables(values.slice(1))) {
        m_target.value.add(value);
    }
}
/**
 * The default strategy to merge maps into a target map.
 *
 * @param m_target - The result will be mutated into this map
 * @param values - The maps (including the target's value if there is one).
 */
function mergeMaps(m_target, values) {
    for (const [key, value] of getIterableOfIterables(values.slice(1))) {
        m_target.value.set(key, value);
    }
}
/**
 * Set the target to the last value.
 */
function mergeOthers(m_target, values) {
    m_target.value = values.at(-1);
}

var defaultMergeIntoFunctions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mergeArrays: mergeArrays,
    mergeMaps: mergeMaps,
    mergeOthers: mergeOthers,
    mergeRecords: mergeRecords,
    mergeSets: mergeSets
});

function deepmergeInto(target, ...objects) {
    return void deepmergeIntoCustom({})(target, ...objects);
}
function deepmergeIntoCustom(options, rootMetaData) {
    const utils = getIntoUtils(options, customizedDeepmergeInto);
    /**
     * The customized deepmerge function.
     */
    function customizedDeepmergeInto(target, ...objects) {
        mergeUnknownsInto({ value: target }, [target, ...objects], utils, rootMetaData);
    }
    return customizedDeepmergeInto;
}
/**
 * The the utils that are available to the merge functions.
 *
 * @param options - The options the user specified
 */
function getIntoUtils(options, customizedDeepmergeInto) {
    return {
        defaultMergeFunctions: defaultMergeIntoFunctions,
        mergeFunctions: {
            ...defaultMergeIntoFunctions,
            ...Object.fromEntries(Object.entries(options)
                .filter(([key, option]) => Object.hasOwn(defaultMergeIntoFunctions, key))
                .map(([key, option]) => option === false
                ? [key, mergeOthers]
                : [key, option])),
        },
        metaDataUpdater: (options.metaDataUpdater ??
            defaultMetaDataUpdater),
        deepmergeInto: customizedDeepmergeInto,
        actions: actionsInto,
    };
}
/**
 * Merge unknown things into a target.
 *
 * @param m_target - The target to merge into.
 * @param values - The values.
 */
function mergeUnknownsInto(m_target, values, utils, meta
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) {
    if (values.length === 0) {
        return;
    }
    if (values.length === 1) {
        return void mergeOthersInto(m_target, values, utils, meta);
    }
    const type = getObjectType(m_target.value);
    if (type !== 0 /* ObjectType.NOT */ && type !== 5 /* ObjectType.OTHER */) {
        for (let m_index = 1; m_index < values.length; m_index++) {
            if (getObjectType(values[m_index]) === type) {
                continue;
            }
            return void mergeOthersInto(m_target, values, utils, meta);
        }
    }
    switch (type) {
        case 1 /* ObjectType.RECORD */: {
            return void mergeRecordsInto(m_target, values, utils, meta);
        }
        case 2 /* ObjectType.ARRAY */: {
            return void mergeArraysInto(m_target, values, utils, meta);
        }
        case 3 /* ObjectType.SET */: {
            return void mergeSetsInto(m_target, values, utils, meta);
        }
        case 4 /* ObjectType.MAP */: {
            return void mergeMapsInto(m_target, values, utils, meta);
        }
        default: {
            return void mergeOthersInto(m_target, values, utils, meta);
        }
    }
}
/**
 * Merge records into a target record.
 *
 * @param m_target - The target to merge into.
 * @param values - The records.
 */
function mergeRecordsInto(m_target, values, utils, meta) {
    const action = utils.mergeFunctions.mergeRecords(m_target, values, utils, meta);
    if (action === actionsInto.defaultMerge) {
        utils.defaultMergeFunctions.mergeRecords(m_target, values, utils, meta);
    }
}
/**
 * Merge arrays into a target array.
 *
 * @param m_target - The target to merge into.
 * @param values - The arrays.
 */
function mergeArraysInto(m_target, values, utils, meta) {
    const action = utils.mergeFunctions.mergeArrays(m_target, values, utils, meta);
    if (action === actionsInto.defaultMerge) {
        utils.defaultMergeFunctions.mergeArrays(m_target, values);
    }
}
/**
 * Merge sets into a target set.
 *
 * @param m_target - The target to merge into.
 * @param values - The sets.
 */
function mergeSetsInto(m_target, values, utils, meta) {
    const action = utils.mergeFunctions.mergeSets(m_target, values, utils, meta);
    if (action === actionsInto.defaultMerge) {
        utils.defaultMergeFunctions.mergeSets(m_target, values);
    }
}
/**
 * Merge maps into a target map.
 *
 * @param m_target - The target to merge into.
 * @param values - The maps.
 */
function mergeMapsInto(m_target, values, utils, meta) {
    const action = utils.mergeFunctions.mergeMaps(m_target, values, utils, meta);
    if (action === actionsInto.defaultMerge) {
        utils.defaultMergeFunctions.mergeMaps(m_target, values);
    }
}
/**
 * Merge other things into a target.
 *
 * @param m_target - The target to merge into.
 * @param values - The other things.
 */
function mergeOthersInto(m_target, values, utils, meta) {
    const action = utils.mergeFunctions.mergeOthers(m_target, values, utils, meta);
    if (action === actionsInto.defaultMerge ||
        m_target.value === actionsInto.defaultMerge) {
        utils.defaultMergeFunctions.mergeOthers(m_target, values);
    }
}

export { deepmerge, deepmergeCustom, deepmergeInto, deepmergeIntoCustom, getKeys, getObjectType, objectHasProperty };
