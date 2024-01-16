/**
 * Serialize a comment.
 *
 * @param {Comment} node
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
export function comment(node: Comment, _1: number | undefined, _2: Parents | undefined, state: State): string;
export type Comment = import('hast').Comment;
export type Parents = import('hast').Parents;
export type State = import('../index.js').State;
