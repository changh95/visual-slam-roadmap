/**
 * @module Option
 *
 */
declare const _default: {
    Cache: {
        Search: string;
        Folder: string;
    };
    Path: string;
    Logger: 2;
    Action: {
        Read: ({ Input }: import("../Interface/File.js").default) => Promise<string>;
        Wrote: ({ Buffer }: import("../Interface/File.js").default) => Promise<import("../Type/Buffer.js").Type>;
        Passed: (On: import("../Interface/File.js").default) => Promise<true>;
        Failed: ({ Input }: import("../Interface/File.js").default) => Promise<string>;
        Accomplished: ({ Input, Output }: import("../Interface/File.js").default) => Promise<string>;
        Fulfilled: ({ Files }: import("../Interface/Plan.js").default) => Promise<string | false>;
        Changed: (Plan: import("../Interface/Plan.js").default) => Promise<import("../Interface/Plan.js").default>;
    };
    Files: string;
    Exclude: false;
};
export default _default;
