/**
 * Serialize a root.
 *
 * @param {Root} node
 *   Node to handle.
 * @param {number | undefined} _1
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _2
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
export function root(node: Root, _1: number | undefined, _2: Parents | undefined, state: State): string;
export type Parents = import('hast').Parents;
export type Root = import('hast').Root;
export type State = import('../index.js').State;
