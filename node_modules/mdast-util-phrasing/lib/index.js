/**
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 */

import {convert} from 'unist-util-is'

/**
 * Check if the given value is *phrasing content*.
 *
 * > 👉 **Note**: Excludes `html`, which can be both phrasing or flow.
 *
 * @param node
 *   Thing to check, typically `Node`.
 * @returns
 *   Whether `value` is phrasing content.
 */

export const phrasing =
  /** @type {(node?: unknown) => node is PhrasingContent} */
  (
    convert([
      'break',
      'delete',
      'emphasis',
      'footnote',
      'footnoteReference',
      'image',
      'imageReference',
      'inlineCode',
      'link',
      'linkReference',
      'strong',
      'text'
    ])
  )
