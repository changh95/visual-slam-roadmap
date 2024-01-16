/**
 * @typedef {import('hast').Parents} Parents
 *
 * @typedef {import('mdast-util-to-hast').Raw} Raw
 *
 * @typedef {import('../index.js').State} State
 */

import {text} from './text.js'

/**
 * Serialize a raw node.
 *
 * @param {Raw} node
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
export function raw(node, index, parent, state) {
  return state.settings.allowDangerousHtml
    ? node.value
    : text(node, index, parent, state)
}
