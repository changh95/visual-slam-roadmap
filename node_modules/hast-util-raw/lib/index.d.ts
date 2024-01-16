/**
 * Pass a hast tree through an HTML parser, which will fix nesting, and turn
 * raw nodes into actual nodes.
 *
 * @param {Nodes} tree
 *   Original hast tree to transform.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Nodes}
 *   Parsed again tree.
 */
export function raw(tree: Nodes, options?: Options | null | undefined): Nodes;
export type Comment = import('hast').Comment;
export type Doctype = import('hast').Doctype;
export type Element = import('hast').Element;
export type Nodes = import('hast').Nodes;
export type Root = import('hast').Root;
export type RootContent = import('hast').RootContent;
export type Text = import('hast').Text;
export type Raw = import('mdast-util-to-hast').Raw;
export type DefaultTreeAdapterMap = import('parse5').DefaultTreeAdapterMap;
export type ParserOptions = import('parse5').ParserOptions<DefaultTreeAdapterMap>;
export type CharacterToken = import('parse5').Token.CharacterToken;
export type CommentToken = import('parse5').Token.CommentToken;
export type DoctypeToken = import('parse5').Token.DoctypeToken;
export type Location = import('parse5').Token.Location;
export type TagToken = import('parse5').Token.TagToken;
export type Point = import('unist').Point;
export type VFile = import('vfile').VFile;
/**
 * Configuration.
 */
export type Options = {
    /**
     * Corresponding virtual file representing the input document (optional).
     */
    file?: VFile | null | undefined;
    /**
     * List of custom hast node types to pass through (as in, keep) (optional).
     *
     * If the passed through nodes have children, those children are expected to
     * be hast again and will be handled.
     */
    passThrough?: Array<Nodes['type']> | null | undefined;
};
/**
 * Info passed around about the current state.
 */
export type State = {
    /**
     *   Add a hast node to the parser.
     */
    handle: (node: Nodes) => undefined;
    /**
     *   User configuration.
     */
    options: Options;
    /**
     *   Current parser.
     */
    parser: Parser<DefaultTreeAdapterMap>;
    /**
     *   Whether there are stitches.
     */
    stitches: boolean;
};
/**
 * Custom comment-like value we pass through parse5, which contains a
 * replacement node that we’ll swap back in afterwards.
 */
export type Stitch = {
    type: 'comment';
    value: {
        stitch: Nodes;
    };
};
import { Parser } from 'parse5';
/**
 * Transform a stitch.
 *
 * @param {Nodes} node
 *   unknown node.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {undefined}
 *   Nothing.
 */
declare function stitch(node: Nodes, state: State): undefined;
export {};
