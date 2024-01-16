function getAstroMetadata(modInfo) {
  if (modInfo.meta?.astro) {
    return modInfo.meta.astro;
  }
  return void 0;
}
export {
  getAstroMetadata
};
