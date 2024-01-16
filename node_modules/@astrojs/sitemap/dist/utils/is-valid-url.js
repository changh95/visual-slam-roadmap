const isValidUrl = (s) => {
  if (typeof s !== "string" || !s) {
    return false;
  }
  try {
    const dummy = new URL(s);
    return true;
  } catch {
    return false;
  }
};
export {
  isValidUrl
};
