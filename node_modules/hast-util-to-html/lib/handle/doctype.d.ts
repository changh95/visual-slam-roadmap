/**
 * Serialize a doctype.
 *
 * @param {Doctype} _1
 *   Node to handle.
 * @param {number | undefined} _2
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _3
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
export function doctype(_1: Doctype, _2: number | undefined, _3: Parents | undefined, state: State): string;
export type Doctype = import('hast').Doctype;
export type Parents = import('hast').Parents;
export type State = import('../index.js').State;
