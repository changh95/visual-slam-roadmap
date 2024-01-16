/**
 * @type {(node: Nodes, index: number | undefined, parent: Parents | undefined, state: State) => string}
 */
export const handle: (node: Nodes, index: number | undefined, parent: Parents | undefined, state: State) => string;
export type Nodes = import('hast').Nodes;
export type Parents = import('hast').Parents;
export type State = import('../index.js').State;
