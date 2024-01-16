const clientAddressSymbol = Symbol.for("astro.clientAddress");
const clientLocalsSymbol = Symbol.for("astro.locals");
function createRequest({
  url,
  headers,
  clientAddress,
  method = "GET",
  body = void 0,
  logger,
  ssr,
  locals
}) {
  let headersObj = headers instanceof Headers ? headers : new Headers(Object.entries(headers));
  const request = new Request(url.toString(), {
    method,
    headers: headersObj,
    body
  });
  if (!ssr) {
    const _headers = request.headers;
    const headersDesc = Object.getOwnPropertyDescriptor(request, "headers") || {};
    Object.defineProperty(request, "headers", {
      ...headersDesc,
      get() {
        logger.warn(
          null,
          `\`Astro.request.headers\` is not available in "static" output mode. To enable header access: set \`output: "server"\` or \`output: "hybrid"\` in your config file.`
        );
        return _headers;
      }
    });
  } else if (clientAddress) {
    Reflect.set(request, clientAddressSymbol, clientAddress);
  }
  Reflect.set(request, clientLocalsSymbol, locals ?? {});
  return request;
}
export {
  createRequest
};
