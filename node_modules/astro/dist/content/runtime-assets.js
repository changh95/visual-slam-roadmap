import { z } from "zod";
import { emitESMImage } from "../assets/utils/emitAsset.js";
function createImage(pluginContext, entryFilePath) {
  return () => {
    return z.string().transform(async (imagePath, ctx) => {
      const resolvedFilePath = (await pluginContext.resolve(imagePath, entryFilePath))?.id;
      const metadata = await emitESMImage(
        resolvedFilePath,
        pluginContext.meta.watchMode,
        pluginContext.emitFile
      );
      if (!metadata) {
        ctx.addIssue({
          code: "custom",
          message: `Image ${imagePath} does not exist. Is the path correct?`,
          fatal: true
        });
        return z.never();
      }
      return { ...metadata, ASTRO_ASSET: metadata.fsPath };
    });
  };
}
export {
  createImage
};
