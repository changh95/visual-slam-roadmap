/**
 * Factory to check if a given node can have a tag omitted.
 *
 * @param {Record<string, OmitHandle>} handlers
 *   Omission handlers, where each key is a tag name, and each value is the
 *   corresponding handler.
 * @returns {OmitHandle}
 *   Whether to omit a tag of an element.
 */
export function omission(handlers: Record<string, OmitHandle>): OmitHandle;
export type Element = import('hast').Element;
export type Parents = import('hast').Parents;
/**
 * Check if a tag can be omitted.
 */
export type OmitHandle = (element: Element, index: number | undefined, parent: Parents | undefined) => boolean;
