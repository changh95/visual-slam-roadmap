function isESMImportedImage(src) {
  return typeof src === "object";
}
function isRemoteImage(src) {
  return typeof src === "string";
}
export {
  isESMImportedImage,
  isRemoteImage
};
