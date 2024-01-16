const renderer = {
  name: "astro:jsx",
  serverEntrypoint: "astro/jsx/server.js",
  jsxImportSource: "astro",
  jsxTransformOptions: async () => {
    const plugin = await import("@babel/plugin-transform-react-jsx");
    const jsx = plugin.default?.default ?? plugin.default;
    const { default: astroJSX } = await import("./babel.js");
    return {
      plugins: [
        astroJSX(),
        jsx({}, { throwIfNamespace: false, runtime: "automatic", importSource: "astro" })
      ]
    };
  }
};
var renderer_default = renderer;
export {
  renderer_default as default
};
