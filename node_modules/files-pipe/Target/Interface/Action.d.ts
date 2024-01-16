/**
 * @module Pipe
 *
 * Represents the execution configuration for specific actions on files.
 *
 */
export default interface Type {
    /**
     * Attaches a callback for the fulfillment of the Action.
     *
     * @param Plan
     *
     */
    Fulfilled?: boolean | ((Plan: Plan) => Promise<false | string>);
    /**
     * Attaches a callback for handling failures in the Action.
     *
     * @param Input The input file being processed.
     *
     * @param _Error The error encountered during execution.
     *
     */
    Failed?: boolean | ((Input: File, _Error: unknown) => Promise<false | string>);
    /**
     * Attaches a callback for actions that are accomplished.
     *
     * @param On The file on which an action was accomplished.
     *
     */
    Accomplished?: boolean | ((On: File) => Promise<false | string>);
    /**
     * Attaches a callback for actions that result in changes to the plan.
     *
     * @param Plan The execution plan to be changed.
     *
     */
    Changed?: (Plan: Plan) => Promise<Plan>;
    /**
     * Attaches a callback for actions that check if a file can pass through the pipe.
     *
     * @param On The file on which the action is being checked.
     *
     */
    Passed?: (On: File) => Promise<boolean>;
    /**
     * Attaches a callback for reading from a file.
     *
     * @param On The file to be read.
     *
     */
    Read?: (On: File) => Promise<Buffer>;
    /**
     * Attaches a callback for writing to a file.
     *
     * @param On The file to be written to.
     *
     */
    Wrote?: (On: File) => Promise<Buffer>;
}
import type Buffer from "../Type/Buffer.js";
import type File from "./File.js";
import type Plan from "./Plan.js";
