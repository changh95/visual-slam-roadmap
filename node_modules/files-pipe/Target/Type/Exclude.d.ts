/**
 * @module Exclude
 *
 * Represents criteria for excluding files.
 *
 */
export type Type = string | RegExp | ((File: string) => boolean);
export type { Type as default };
