/**
 * Figure out the alignment of a GFM table.
 *
 * @param {Readonly<Array<Event>>} events
 *   List of events.
 * @param {number} index
 *   Table enter event.
 * @returns {Array<Align>}
 *   List of aligns.
 */
export function gfmTableAlign(
  events: Readonly<Array<import('micromark-util-types').Event>>,
  index: number
): Array<Align>
export type Event = import('micromark-util-types').Event
export type Align = 'center' | 'left' | 'none' | 'right'
