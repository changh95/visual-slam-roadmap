import * as Core from 'openai/core';
import { APIResource } from 'openai/resource';
import * as MessagesAPI from 'openai/resources/beta/threads/messages/messages';
import * as FilesAPI from 'openai/resources/beta/threads/messages/files';
import { CursorPage, type CursorPageParams } from 'openai/pagination';
export declare class Messages extends APIResource {
    files: FilesAPI.Files;
    /**
     * Create a message.
     */
    create(threadId: string, body: MessageCreateParams, options?: Core.RequestOptions): Core.APIPromise<ThreadMessage>;
    /**
     * Retrieve a message.
     */
    retrieve(threadId: string, messageId: string, options?: Core.RequestOptions): Core.APIPromise<ThreadMessage>;
    /**
     * Modifies a message.
     */
    update(threadId: string, messageId: string, body: MessageUpdateParams, options?: Core.RequestOptions): Core.APIPromise<ThreadMessage>;
    /**
     * Returns a list of messages for a given thread.
     */
    list(threadId: string, query?: MessageListParams, options?: Core.RequestOptions): Core.PagePromise<ThreadMessagesPage, ThreadMessage>;
    list(threadId: string, options?: Core.RequestOptions): Core.PagePromise<ThreadMessagesPage, ThreadMessage>;
}
export declare class ThreadMessagesPage extends CursorPage<ThreadMessage> {
}
/**
 * References an image [File](https://platform.openai.com/docs/api-reference/files)
 * in the content of a message.
 */
export interface MessageContentImageFile {
    image_file: MessageContentImageFile.ImageFile;
    /**
     * Always `image_file`.
     */
    type: 'image_file';
}
export declare namespace MessageContentImageFile {
    interface ImageFile {
        /**
         * The [File](https://platform.openai.com/docs/api-reference/files) ID of the image
         * in the message content.
         */
        file_id: string;
    }
}
/**
 * The text content that is part of a message.
 */
export interface MessageContentText {
    text: MessageContentText.Text;
    /**
     * Always `text`.
     */
    type: 'text';
}
export declare namespace MessageContentText {
    interface Text {
        annotations: Array<Text.FileCitation | Text.FilePath>;
        /**
         * The data that makes up the text.
         */
        value: string;
    }
    namespace Text {
        /**
         * A citation within the message that points to a specific quote from a specific
         * File associated with the assistant or the message. Generated when the assistant
         * uses the "retrieval" tool to search files.
         */
        interface FileCitation {
            end_index: number;
            file_citation: FileCitation.FileCitation;
            start_index: number;
            /**
             * The text in the message content that needs to be replaced.
             */
            text: string;
            /**
             * Always `file_citation`.
             */
            type: 'file_citation';
        }
        namespace FileCitation {
            interface FileCitation {
                /**
                 * The ID of the specific File the citation is from.
                 */
                file_id: string;
                /**
                 * The specific quote in the file.
                 */
                quote: string;
            }
        }
        /**
         * A URL for the file that's generated when the assistant used the
         * `code_interpreter` tool to generate a file.
         */
        interface FilePath {
            end_index: number;
            file_path: FilePath.FilePath;
            start_index: number;
            /**
             * The text in the message content that needs to be replaced.
             */
            text: string;
            /**
             * Always `file_path`.
             */
            type: 'file_path';
        }
        namespace FilePath {
            interface FilePath {
                /**
                 * The ID of the file that was generated.
                 */
                file_id: string;
            }
        }
    }
}
/**
 * Represents a message within a
 * [thread](https://platform.openai.com/docs/api-reference/threads).
 */
export interface ThreadMessage {
    /**
     * The identifier, which can be referenced in API endpoints.
     */
    id: string;
    /**
     * If applicable, the ID of the
     * [assistant](https://platform.openai.com/docs/api-reference/assistants) that
     * authored this message.
     */
    assistant_id: string | null;
    /**
     * The content of the message in array of text and/or images.
     */
    content: Array<MessageContentImageFile | MessageContentText>;
    /**
     * The Unix timestamp (in seconds) for when the message was created.
     */
    created_at: number;
    /**
     * A list of [file](https://platform.openai.com/docs/api-reference/files) IDs that
     * the assistant should use. Useful for tools like retrieval and code_interpreter
     * that can access files. A maximum of 10 files can be attached to a message.
     */
    file_ids: Array<string>;
    /**
     * Set of 16 key-value pairs that can be attached to an object. This can be useful
     * for storing additional information about the object in a structured format. Keys
     * can be a maximum of 64 characters long and values can be a maxium of 512
     * characters long.
     */
    metadata: unknown | null;
    /**
     * The object type, which is always `thread.message`.
     */
    object: 'thread.message';
    /**
     * The entity that produced the message. One of `user` or `assistant`.
     */
    role: 'user' | 'assistant';
    /**
     * If applicable, the ID of the
     * [run](https://platform.openai.com/docs/api-reference/runs) associated with the
     * authoring of this message.
     */
    run_id: string | null;
    /**
     * The [thread](https://platform.openai.com/docs/api-reference/threads) ID that
     * this message belongs to.
     */
    thread_id: string;
}
export interface ThreadMessageDeleted {
    id: string;
    deleted: boolean;
    object: 'thread.message.deleted';
}
export interface MessageCreateParams {
    /**
     * The content of the message.
     */
    content: string;
    /**
     * The role of the entity that is creating the message. Currently only `user` is
     * supported.
     */
    role: 'user';
    /**
     * A list of [File](https://platform.openai.com/docs/api-reference/files) IDs that
     * the message should use. There can be a maximum of 10 files attached to a
     * message. Useful for tools like `retrieval` and `code_interpreter` that can
     * access and use files.
     */
    file_ids?: Array<string>;
    /**
     * Set of 16 key-value pairs that can be attached to an object. This can be useful
     * for storing additional information about the object in a structured format. Keys
     * can be a maximum of 64 characters long and values can be a maxium of 512
     * characters long.
     */
    metadata?: unknown | null;
}
export interface MessageUpdateParams {
    /**
     * Set of 16 key-value pairs that can be attached to an object. This can be useful
     * for storing additional information about the object in a structured format. Keys
     * can be a maximum of 64 characters long and values can be a maxium of 512
     * characters long.
     */
    metadata?: unknown | null;
}
export interface MessageListParams extends CursorPageParams {
    /**
     * A cursor for use in pagination. `before` is an object ID that defines your place
     * in the list. For instance, if you make a list request and receive 100 objects,
     * ending with obj_foo, your subsequent call can include before=obj_foo in order to
     * fetch the previous page of the list.
     */
    before?: string;
    /**
     * Sort order by the `created_at` timestamp of the objects. `asc` for ascending
     * order and `desc` for descending order.
     */
    order?: 'asc' | 'desc';
}
export declare namespace Messages {
    export import MessageContentImageFile = MessagesAPI.MessageContentImageFile;
    export import MessageContentText = MessagesAPI.MessageContentText;
    export import ThreadMessage = MessagesAPI.ThreadMessage;
    export import ThreadMessageDeleted = MessagesAPI.ThreadMessageDeleted;
    export import ThreadMessagesPage = MessagesAPI.ThreadMessagesPage;
    export import MessageCreateParams = MessagesAPI.MessageCreateParams;
    export import MessageUpdateParams = MessagesAPI.MessageUpdateParams;
    export import MessageListParams = MessagesAPI.MessageListParams;
    export import Files = FilesAPI.Files;
    export import MessageFile = FilesAPI.MessageFile;
    export import MessageFilesPage = FilesAPI.MessageFilesPage;
    export import FileListParams = FilesAPI.FileListParams;
}
//# sourceMappingURL=messages.d.ts.map