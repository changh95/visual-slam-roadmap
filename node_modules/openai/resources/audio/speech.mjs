// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'openai/resource';
export class Speech extends APIResource {
    /**
     * Generates audio from the input text.
     */
    create(body, options) {
        return this._client.post('/audio/speech', { body, ...options, __binaryResponse: true });
    }
}
(function (Speech) {
})(Speech || (Speech = {}));
//# sourceMappingURL=speech.mjs.map