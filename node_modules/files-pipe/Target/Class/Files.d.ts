/**
 * @module Files
 *
 */
export default class implements Type {
    In: (Path: import("../Type/Path.js").Type) => Promise<this>;
    By: (File: string | string[]) => Promise<this>;
    Not: (File: boolean | import("../Type/Exclude.js").Type | Set<import("../Type/Exclude.js").Type> | import("../Type/Exclude.js").Type[] | undefined) => Promise<this>;
    Pipe: (Action?: import("../Interface/Action.js").default | undefined) => Promise<this>;
    Plan: Plan;
    constructor(Cache?: Option["Cache"], Logger?: Option["Logger"]);
}
import type Type from "../Interface/Files.js";
import type Option from "../Interface/Option.js";
import type Plan from "../Interface/Plan.js";
export declare const Cache: {
    Search: string;
    Folder: string;
}, Logger: 2, Action: {
    Read: ({ Input }: import("../Interface/File.js").default) => Promise<string>;
    Wrote: ({ Buffer }: import("../Interface/File.js").default) => Promise<import("../Type/Buffer.js").Type>;
    Passed: (On: import("../Interface/File.js").default) => Promise<true>;
    Failed: ({ Input }: import("../Interface/File.js").default) => Promise<string>;
    Accomplished: ({ Input, Output }: import("../Interface/File.js").default) => Promise<string>;
    Fulfilled: ({ Files }: Plan) => Promise<string | false>;
    Changed: (Plan: Plan) => Promise<Plan>;
};
export declare const Merge: import("../Interface/Merge.js").default<import("../Interface/Merge.js").Generic>;
