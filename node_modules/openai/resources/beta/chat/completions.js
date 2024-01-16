"use strict";
// File generated from our OpenAPI spec by Stainless.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Completions = exports.ChatCompletionStream = exports.ParsingToolFunction = exports.ParsingFunction = exports.ChatCompletionStreamingRunner = exports.ChatCompletionRunner = void 0;
const resource_1 = require("openai/resource");
const ChatCompletionRunner_1 = require("openai/lib/ChatCompletionRunner");
var ChatCompletionRunner_2 = require("openai/lib/ChatCompletionRunner");
Object.defineProperty(exports, "ChatCompletionRunner", { enumerable: true, get: function () { return ChatCompletionRunner_2.ChatCompletionRunner; } });
const ChatCompletionStreamingRunner_1 = require("openai/lib/ChatCompletionStreamingRunner");
var ChatCompletionStreamingRunner_2 = require("openai/lib/ChatCompletionStreamingRunner");
Object.defineProperty(exports, "ChatCompletionStreamingRunner", { enumerable: true, get: function () { return ChatCompletionStreamingRunner_2.ChatCompletionStreamingRunner; } });
var RunnableFunction_1 = require("openai/lib/RunnableFunction");
Object.defineProperty(exports, "ParsingFunction", { enumerable: true, get: function () { return RunnableFunction_1.ParsingFunction; } });
Object.defineProperty(exports, "ParsingToolFunction", { enumerable: true, get: function () { return RunnableFunction_1.ParsingToolFunction; } });
const ChatCompletionStream_1 = require("openai/lib/ChatCompletionStream");
var ChatCompletionStream_2 = require("openai/lib/ChatCompletionStream");
Object.defineProperty(exports, "ChatCompletionStream", { enumerable: true, get: function () { return ChatCompletionStream_2.ChatCompletionStream; } });
class Completions extends resource_1.APIResource {
    runFunctions(body, options) {
        if (body.stream) {
            return ChatCompletionStreamingRunner_1.ChatCompletionStreamingRunner.runFunctions(this._client.chat.completions, body, options);
        }
        return ChatCompletionRunner_1.ChatCompletionRunner.runFunctions(this._client.chat.completions, body, options);
    }
    runTools(body, options) {
        if (body.stream) {
            return ChatCompletionStreamingRunner_1.ChatCompletionStreamingRunner.runTools(this._client.chat.completions, body, options);
        }
        return ChatCompletionRunner_1.ChatCompletionRunner.runTools(this._client.chat.completions, body, options);
    }
    /**
     * Creates a chat completion stream
     */
    stream(body, options) {
        return ChatCompletionStream_1.ChatCompletionStream.createChatCompletion(this._client.chat.completions, body, options);
    }
}
exports.Completions = Completions;
//# sourceMappingURL=completions.js.map