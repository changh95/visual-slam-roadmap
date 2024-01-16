/**
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('hast').Text} Text
 *
 * @typedef {import('mdast-util-to-hast').Raw} Raw
 *
 * @typedef {import('../index.js').State} State
 */

import {stringifyEntities} from 'stringify-entities'

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
export function text(node, _, parent, state) {
  // Check if content of `node` should be escaped.
  return parent &&
    parent.type === 'element' &&
    (parent.tagName === 'script' || parent.tagName === 'style')
    ? node.value
    : stringifyEntities(
        node.value,
        Object.assign({}, state.settings.characterReferences, {
          subset: ['<', '&']
        })
      )
}
