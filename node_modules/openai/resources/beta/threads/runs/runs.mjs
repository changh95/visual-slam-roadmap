// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'openai/resource';
import { isRequestOptions } from 'openai/core';
import * as RunsAPI from 'openai/resources/beta/threads/runs/runs';
import * as StepsAPI from 'openai/resources/beta/threads/runs/steps';
import { CursorPage } from 'openai/pagination';
export class Runs extends APIResource {
    constructor() {
        super(...arguments);
        this.steps = new StepsAPI.Steps(this._client);
    }
    /**
     * Create a run.
     */
    create(threadId, body, options) {
        return this._client.post(`/threads/${threadId}/runs`, {
            body,
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    /**
     * Retrieves a run.
     */
    retrieve(threadId, runId, options) {
        return this._client.get(`/threads/${threadId}/runs/${runId}`, {
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    /**
     * Modifies a run.
     */
    update(threadId, runId, body, options) {
        return this._client.post(`/threads/${threadId}/runs/${runId}`, {
            body,
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    list(threadId, query = {}, options) {
        if (isRequestOptions(query)) {
            return this.list(threadId, {}, query);
        }
        return this._client.getAPIList(`/threads/${threadId}/runs`, RunsPage, {
            query,
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    /**
     * Cancels a run that is `in_progress`.
     */
    cancel(threadId, runId, options) {
        return this._client.post(`/threads/${threadId}/runs/${runId}/cancel`, {
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    /**
     * When a run has the `status: "requires_action"` and `required_action.type` is
     * `submit_tool_outputs`, this endpoint can be used to submit the outputs from the
     * tool calls once they're all completed. All outputs must be submitted in a single
     * request.
     */
    submitToolOutputs(threadId, runId, body, options) {
        return this._client.post(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
            body,
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
}
export class RunsPage extends CursorPage {
}
(function (Runs) {
    Runs.RunsPage = RunsAPI.RunsPage;
    Runs.Steps = StepsAPI.Steps;
    Runs.RunStepsPage = StepsAPI.RunStepsPage;
})(Runs || (Runs = {}));
//# sourceMappingURL=runs.mjs.map