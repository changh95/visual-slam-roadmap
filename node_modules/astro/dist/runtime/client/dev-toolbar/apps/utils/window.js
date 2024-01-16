function createWindowElement(content) {
  const windowElement = document.createElement("astro-dev-toolbar-window");
  windowElement.innerHTML = content;
  return windowElement;
}
export {
  createWindowElement
};
