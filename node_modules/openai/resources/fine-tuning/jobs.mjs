// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'openai/resource';
import { isRequestOptions } from 'openai/core';
import * as JobsAPI from 'openai/resources/fine-tuning/jobs';
import { CursorPage } from 'openai/pagination';
export class Jobs extends APIResource {
    /**
     * Creates a fine-tuning job which begins the process of creating a new model from
     * a given dataset.
     *
     * Response includes details of the enqueued job including job status and the name
     * of the fine-tuned models once complete.
     *
     * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)
     */
    create(body, options) {
        return this._client.post('/fine_tuning/jobs', { body, ...options });
    }
    /**
     * Get info about a fine-tuning job.
     *
     * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)
     */
    retrieve(fineTuningJobId, options) {
        return this._client.get(`/fine_tuning/jobs/${fineTuningJobId}`, options);
    }
    list(query = {}, options) {
        if (isRequestOptions(query)) {
            return this.list({}, query);
        }
        return this._client.getAPIList('/fine_tuning/jobs', FineTuningJobsPage, { query, ...options });
    }
    /**
     * Immediately cancel a fine-tune job.
     */
    cancel(fineTuningJobId, options) {
        return this._client.post(`/fine_tuning/jobs/${fineTuningJobId}/cancel`, options);
    }
    listEvents(fineTuningJobId, query = {}, options) {
        if (isRequestOptions(query)) {
            return this.listEvents(fineTuningJobId, {}, query);
        }
        return this._client.getAPIList(`/fine_tuning/jobs/${fineTuningJobId}/events`, FineTuningJobEventsPage, {
            query,
            ...options,
        });
    }
}
export class FineTuningJobsPage extends CursorPage {
}
export class FineTuningJobEventsPage extends CursorPage {
}
(function (Jobs) {
    Jobs.FineTuningJobsPage = JobsAPI.FineTuningJobsPage;
    Jobs.FineTuningJobEventsPage = JobsAPI.FineTuningJobEventsPage;
})(Jobs || (Jobs = {}));
//# sourceMappingURL=jobs.mjs.map