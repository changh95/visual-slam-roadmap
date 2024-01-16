const idleDirective = (load) => {
  const cb = async () => {
    const hydrate = await load();
    await hydrate();
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(cb);
  } else {
    setTimeout(cb, 200);
  }
};
var idle_default = idleDirective;
export {
  idle_default as default
};
