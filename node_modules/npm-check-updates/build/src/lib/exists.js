"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
/** Returns true if a file exists. */
const exists = (path) => promises_1.default.stat(path).then(() => true, () => false);
exports.default = exists;
//# sourceMappingURL=exists.js.map