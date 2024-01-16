// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'openai/resource';
import { isRequestOptions } from 'openai/core';
import * as AssistantsAPI from 'openai/resources/beta/assistants/assistants';
import * as FilesAPI from 'openai/resources/beta/assistants/files';
import { CursorPage } from 'openai/pagination';
export class Assistants extends APIResource {
    constructor() {
        super(...arguments);
        this.files = new FilesAPI.Files(this._client);
    }
    /**
     * Create an assistant with a model and instructions.
     */
    create(body, options) {
        return this._client.post('/assistants', {
            body,
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    /**
     * Retrieves an assistant.
     */
    retrieve(assistantId, options) {
        return this._client.get(`/assistants/${assistantId}`, {
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    /**
     * Modifies an assistant.
     */
    update(assistantId, body, options) {
        return this._client.post(`/assistants/${assistantId}`, {
            body,
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    list(query = {}, options) {
        if (isRequestOptions(query)) {
            return this.list({}, query);
        }
        return this._client.getAPIList('/assistants', AssistantsPage, {
            query,
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
    /**
     * Delete an assistant.
     */
    del(assistantId, options) {
        return this._client.delete(`/assistants/${assistantId}`, {
            ...options,
            headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
        });
    }
}
export class AssistantsPage extends CursorPage {
}
(function (Assistants) {
    Assistants.AssistantsPage = AssistantsAPI.AssistantsPage;
    Assistants.Files = FilesAPI.Files;
    Assistants.AssistantFilesPage = FilesAPI.AssistantFilesPage;
})(Assistants || (Assistants = {}));
//# sourceMappingURL=assistants.mjs.map