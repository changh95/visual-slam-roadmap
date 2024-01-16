// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'openai/resource';
import { ChatCompletionRunner } from 'openai/lib/ChatCompletionRunner';
export { ChatCompletionRunner } from 'openai/lib/ChatCompletionRunner';
import { ChatCompletionStreamingRunner, } from 'openai/lib/ChatCompletionStreamingRunner';
export { ChatCompletionStreamingRunner, } from 'openai/lib/ChatCompletionStreamingRunner';
export { ParsingFunction, ParsingToolFunction, } from 'openai/lib/RunnableFunction';
import { ChatCompletionStream } from 'openai/lib/ChatCompletionStream';
export { ChatCompletionStream } from 'openai/lib/ChatCompletionStream';
export class Completions extends APIResource {
    runFunctions(body, options) {
        if (body.stream) {
            return ChatCompletionStreamingRunner.runFunctions(this._client.chat.completions, body, options);
        }
        return ChatCompletionRunner.runFunctions(this._client.chat.completions, body, options);
    }
    runTools(body, options) {
        if (body.stream) {
            return ChatCompletionStreamingRunner.runTools(this._client.chat.completions, body, options);
        }
        return ChatCompletionRunner.runTools(this._client.chat.completions, body, options);
    }
    /**
     * Creates a chat completion stream
     */
    stream(body, options) {
        return ChatCompletionStream.createChatCompletion(this._client.chat.completions, body, options);
    }
}
//# sourceMappingURL=completions.mjs.map