// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'openai/resource';
import * as JobsAPI from 'openai/resources/fine-tuning/jobs';
export class FineTuning extends APIResource {
    constructor() {
        super(...arguments);
        this.jobs = new JobsAPI.Jobs(this._client);
    }
}
(function (FineTuning) {
    FineTuning.Jobs = JobsAPI.Jobs;
    FineTuning.FineTuningJobsPage = JobsAPI.FineTuningJobsPage;
    FineTuning.FineTuningJobEventsPage = JobsAPI.FineTuningJobEventsPage;
})(FineTuning || (FineTuning = {}));
//# sourceMappingURL=fine-tuning.mjs.map