import { EventEmitter } from "node:events";
import path from "node:path";
function createViteLoader(viteServer) {
  const events = new EventEmitter();
  let isTsconfigUpdated = false;
  function isTsconfigUpdate(filePath) {
    const result = path.basename(filePath) === "tsconfig.json";
    if (result)
      isTsconfigUpdated = true;
    return result;
  }
  viteServer.watcher.on("add", (...args) => {
    if (!isTsconfigUpdate(args[0])) {
      events.emit("file-add", args);
    }
  });
  viteServer.watcher.on("unlink", (...args) => {
    if (!isTsconfigUpdate(args[0])) {
      events.emit("file-unlink", args);
    }
  });
  viteServer.watcher.on("change", (...args) => {
    if (!isTsconfigUpdate(args[0])) {
      events.emit("file-change", args);
    }
  });
  const _wsSend = viteServer.ws.send;
  viteServer.ws.send = function(...args) {
    if (isTsconfigUpdated) {
      isTsconfigUpdated = false;
      return;
    }
    const msg = args[0];
    if (msg?.type === "error") {
      events.emit("hmr-error", msg);
    }
    _wsSend.apply(this, args);
  };
  return {
    import(src) {
      return viteServer.ssrLoadModule(src);
    },
    async resolveId(spec, parent) {
      const ret = await viteServer.pluginContainer.resolveId(spec, parent);
      return ret?.id;
    },
    getModuleById(id) {
      return viteServer.moduleGraph.getModuleById(id);
    },
    getModulesByFile(file) {
      return viteServer.moduleGraph.getModulesByFile(file);
    },
    getModuleInfo(id) {
      return viteServer.pluginContainer.getModuleInfo(id);
    },
    eachModule(cb) {
      return viteServer.moduleGraph.idToModuleMap.forEach(cb);
    },
    invalidateModule(mod) {
      viteServer.moduleGraph.invalidateModule(mod);
    },
    fixStacktrace(err) {
      return viteServer.ssrFixStacktrace(err);
    },
    clientReload() {
      viteServer.ws.send({
        type: "full-reload",
        path: "*"
      });
    },
    webSocketSend(msg) {
      return viteServer.ws.send(msg);
    },
    isHttps() {
      return !!viteServer.config.server.https;
    },
    events
  };
}
export {
  createViteLoader
};
