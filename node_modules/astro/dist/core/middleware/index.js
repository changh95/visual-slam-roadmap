import { createAPIContext } from "../endpoint/index.js";
import { sequence } from "./sequence.js";
function defineMiddleware(fn) {
  return fn;
}
function createContext({ request, params, userDefinedLocales = [] }) {
  return createAPIContext({
    request,
    params: params ?? {},
    props: {},
    site: void 0,
    locales: userDefinedLocales,
    defaultLocale: void 0,
    routingStrategy: void 0
  });
}
function isLocalsSerializable(value) {
  let type = typeof value;
  let plainObject = true;
  if (type === "object" && isPlainObject(value)) {
    for (const [, nestedValue] of Object.entries(value)) {
      if (!isLocalsSerializable(nestedValue)) {
        plainObject = false;
        break;
      }
    }
  } else {
    plainObject = false;
  }
  let result = value === null || type === "string" || type === "number" || type === "boolean" || Array.isArray(value) || plainObject;
  return result;
}
function isPlainObject(value) {
  if (typeof value !== "object" || value === null)
    return false;
  let proto = Object.getPrototypeOf(value);
  if (proto === null)
    return true;
  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }
  return proto === baseProto;
}
function trySerializeLocals(value) {
  if (isLocalsSerializable(value)) {
    return JSON.stringify(value);
  } else {
    throw new Error("The passed value can't be serialized.");
  }
}
export {
  createContext,
  defineMiddleware,
  sequence,
  trySerializeLocals
};
