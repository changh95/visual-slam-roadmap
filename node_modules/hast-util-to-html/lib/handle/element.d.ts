/**
 * Serialize an element node.
 *
 * @param {Element} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
export function element(node: Element, index: number | undefined, parent: Parents | undefined, state: State): string;
export type Element = import('hast').Element;
export type Parents = import('hast').Parents;
export type Properties = import('hast').Properties;
export type State = import('../index.js').State;
