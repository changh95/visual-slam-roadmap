import { collectErrorMetadata } from "../core/errors/dev/index.js";
import { createSafeError, AstroErrorData } from "../core/errors/index.js";
import { formatErrorMessage } from "../core/messages.js";
import { eventError, telemetry } from "../events/index.js";
function recordServerError(loader, config, pipeline, _err) {
  const err = createSafeError(_err);
  try {
    loader.fixStacktrace(err);
  } catch {
  }
  const errorWithMetadata = collectErrorMetadata(err, config.root);
  if (errorWithMetadata.name !== AstroErrorData.UnhandledRejection.name) {
    telemetry.record(eventError({ cmd: "dev", err: errorWithMetadata, isFatal: false }));
  }
  pipeline.logger.error(
    null,
    formatErrorMessage(errorWithMetadata, pipeline.logger.level() === "debug")
  );
  return {
    error: err,
    errorWithMetadata
  };
}
export {
  recordServerError
};
