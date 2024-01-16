import { APIResource } from 'openai/resource';
import * as AssistantsAPI from 'openai/resources/beta/assistants/assistants';
import * as ChatAPI from 'openai/resources/beta/chat/chat';
import * as ThreadsAPI from 'openai/resources/beta/threads/threads';
export declare class Beta extends APIResource {
    chat: ChatAPI.Chat;
    assistants: AssistantsAPI.Assistants;
    threads: ThreadsAPI.Threads;
}
export declare namespace Beta {
    export import Chat = ChatAPI.Chat;
    export import Assistants = AssistantsAPI.Assistants;
    export import Assistant = AssistantsAPI.Assistant;
    export import AssistantDeleted = AssistantsAPI.AssistantDeleted;
    export import AssistantsPage = AssistantsAPI.AssistantsPage;
    export import AssistantCreateParams = AssistantsAPI.AssistantCreateParams;
    export import AssistantUpdateParams = AssistantsAPI.AssistantUpdateParams;
    export import AssistantListParams = AssistantsAPI.AssistantListParams;
    export import Threads = ThreadsAPI.Threads;
    export import Thread = ThreadsAPI.Thread;
    export import ThreadDeleted = ThreadsAPI.ThreadDeleted;
    export import ThreadCreateParams = ThreadsAPI.ThreadCreateParams;
    export import ThreadUpdateParams = ThreadsAPI.ThreadUpdateParams;
    export import ThreadCreateAndRunParams = ThreadsAPI.ThreadCreateAndRunParams;
}
//# sourceMappingURL=beta.d.ts.map