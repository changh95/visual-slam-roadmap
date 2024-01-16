/**
 * Plugin to add support for serializing as HTML.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {undefined}
 *   Nothing.
 */
export default function rehypeStringify(options?: Options | null | undefined): undefined;
export default class rehypeStringify {
    /**
     * Plugin to add support for serializing as HTML.
     *
     * @param {Options | null | undefined} [options]
     *   Configuration (optional).
     * @returns {undefined}
     *   Nothing.
     */
    constructor(options?: Options | null | undefined);
    compiler: (tree: import("hast").Root, file: import("vfile").VFile) => string;
}
export type Root = import('hast').Root;
export type Options = import('hast-util-to-html').Options;
export type Compiler = import('unified').Compiler<Root, string>;
