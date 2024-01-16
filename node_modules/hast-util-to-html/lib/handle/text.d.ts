/**
 * Serialize a text node.
 *
 * @param {Raw | Text} node
 *   Node to handle.
 * @param {number | undefined} _
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
export function text(node: Raw | Text, _: number | undefined, parent: Parents | undefined, state: State): string;
export type Parents = import('hast').Parents;
export type Text = import('hast').Text;
export type Raw = import('mdast-util-to-hast').Raw;
export type State = import('../index.js').State;
