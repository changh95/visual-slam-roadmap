/**
 * @module File
 *
 * Represents a file specification.
 *
 */
export default interface Type {
    /**
     * The input file.
     */
    Input: string;
    /**
     * The output file.
     */
    Output: string;
    /**
     * The size after the action.
     */
    After: number;
    /**
     * The size before the action.
     */
    Before: number;
    /**
     * The buffer data.
     */
    Buffer: Buffer;
}
import type Buffer from "../Type/Buffer.js";
