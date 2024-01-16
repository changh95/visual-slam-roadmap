import probe from "probe-image-size";
import { AstroError, AstroErrorData } from "../../core/errors/index.js";
async function imageMetadata(data, src) {
  const result = probe.sync(data);
  if (result === null) {
    throw new AstroError({
      ...AstroErrorData.NoImageMetadata,
      message: AstroErrorData.NoImageMetadata.message(src)
    });
  }
  const { width, height, type, orientation } = result;
  const isPortrait = (orientation || 0) >= 5;
  return {
    width: isPortrait ? height : width,
    height: isPortrait ? width : height,
    format: type,
    orientation
  };
}
export {
  imageMetadata
};
