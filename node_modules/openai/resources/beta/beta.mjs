// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'openai/resource';
import * as AssistantsAPI from 'openai/resources/beta/assistants/assistants';
import * as ChatAPI from 'openai/resources/beta/chat/chat';
import * as ThreadsAPI from 'openai/resources/beta/threads/threads';
export class Beta extends APIResource {
    constructor() {
        super(...arguments);
        this.chat = new ChatAPI.Chat(this._client);
        this.assistants = new AssistantsAPI.Assistants(this._client);
        this.threads = new ThreadsAPI.Threads(this._client);
    }
}
(function (Beta) {
    Beta.Chat = ChatAPI.Chat;
    Beta.Assistants = AssistantsAPI.Assistants;
    Beta.AssistantsPage = AssistantsAPI.AssistantsPage;
    Beta.Threads = ThreadsAPI.Threads;
})(Beta || (Beta = {}));
//# sourceMappingURL=beta.mjs.map