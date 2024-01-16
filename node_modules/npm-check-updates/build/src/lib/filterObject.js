"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const keyValueBy_1 = __importDefault(require("./keyValueBy"));
/** Filters an object by a predicate. */
const filterObject = (obj, predicate) => (0, keyValueBy_1.default)(obj, (key, value) => (predicate(key, value) ? { [key]: value } : null));
exports.default = filterObject;
//# sourceMappingURL=filterObject.js.map