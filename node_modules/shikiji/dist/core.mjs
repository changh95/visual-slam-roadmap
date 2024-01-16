async function main$1(Module) {
  let wasmMemory;
  let buffer, HEAPU8;
  function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module.HEAP8 = new Int8Array(buf);
    Module.HEAP16 = new Int16Array(buf);
    Module.HEAP32 = new Int32Array(buf);
    Module.HEAPU8 = HEAPU8 = new Uint8Array(buf);
    Module.HEAPU16 = new Uint16Array(buf);
    Module.HEAPU32 = new Uint32Array(buf);
    Module.HEAPF32 = new Float32Array(buf);
    Module.HEAPF64 = new Float64Array(buf);
  }
  const _emscripten_get_now = () => performance.now();
  function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num);
  }
  function getHeapMax() {
    return 2147483648;
  }
  function emscripten_realloc_buffer(size) {
    try {
      wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
      updateGlobalBufferAndViews(wasmMemory.buffer);
      return 1;
    } catch (e) {
    }
  }
  function _emscripten_resize_heap(requestedSize) {
    const oldSize = HEAPU8.length;
    requestedSize = requestedSize >>> 0;
    const maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize)
      return false;
    const alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
    for (let cutDown = 1; cutDown <= 4; cutDown *= 2) {
      let overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      const newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
      const replacement = emscripten_realloc_buffer(newSize);
      if (replacement)
        return true;
    }
    return false;
  }
  const asmLibraryArg = {
    emscripten_get_now: _emscripten_get_now,
    emscripten_memcpy_big: _emscripten_memcpy_big,
    emscripten_resize_heap: _emscripten_resize_heap,
    fd_write: () => 0
  };
  async function createWasm() {
    const info = {
      env: asmLibraryArg,
      wasi_snapshot_preview1: asmLibraryArg
    };
    function receiveInstance(instance) {
      const exports2 = instance.exports;
      Module.asm = exports2;
      wasmMemory = Module.asm.memory;
      updateGlobalBufferAndViews(wasmMemory.buffer);
    }
    const exports = await Module.instantiateWasm(info);
    receiveInstance(exports);
    return exports;
  }
  await createWasm();
  Module._omalloc = function() {
    return (Module._omalloc = Module.asm.omalloc).apply(null, arguments);
  };
  Module._ofree = function() {
    return (Module._ofree = Module.asm.ofree).apply(null, arguments);
  };
  Module._getLastOnigError = function() {
    return (Module._getLastOnigError = Module.asm.getLastOnigError).apply(null, arguments);
  };
  Module._createOnigScanner = function() {
    return (Module._createOnigScanner = Module.asm.createOnigScanner).apply(null, arguments);
  };
  Module._freeOnigScanner = function() {
    return (Module._freeOnigScanner = Module.asm.freeOnigScanner).apply(null, arguments);
  };
  Module._findNextOnigScannerMatch = function() {
    return (Module._findNextOnigScannerMatch = Module.asm.findNextOnigScannerMatch).apply(null, arguments);
  };
  Module._findNextOnigScannerMatchDbg = function() {
    return (Module._findNextOnigScannerMatchDbg = Module.asm.findNextOnigScannerMatchDbg).apply(null, arguments);
  };
  return Module;
}

let onigBinding = null;
let defaultDebugCall = false;
function throwLastOnigError(onigBinding2) {
  throw new Error(onigBinding2.UTF8ToString(onigBinding2._getLastOnigError()));
}
class UtfString {
  static _utf8ByteLength(str) {
    let result = 0;
    for (let i = 0, len = str.length; i < len; i++) {
      const charCode = str.charCodeAt(i);
      let codepoint = charCode;
      let wasSurrogatePair = false;
      if (charCode >= 55296 && charCode <= 56319) {
        if (i + 1 < len) {
          const nextCharCode = str.charCodeAt(i + 1);
          if (nextCharCode >= 56320 && nextCharCode <= 57343) {
            codepoint = (charCode - 55296 << 10) + 65536 | nextCharCode - 56320;
            wasSurrogatePair = true;
          }
        }
      }
      if (codepoint <= 127)
        result += 1;
      else if (codepoint <= 2047)
        result += 2;
      else if (codepoint <= 65535)
        result += 3;
      else
        result += 4;
      if (wasSurrogatePair)
        i++;
    }
    return result;
  }
  constructor(str) {
    const utf16Length = str.length;
    const utf8Length = UtfString._utf8ByteLength(str);
    const computeIndicesMapping = utf8Length !== utf16Length;
    const utf16OffsetToUtf8 = computeIndicesMapping ? new Uint32Array(utf16Length + 1) : null;
    if (computeIndicesMapping)
      utf16OffsetToUtf8[utf16Length] = utf8Length;
    const utf8OffsetToUtf16 = computeIndicesMapping ? new Uint32Array(utf8Length + 1) : null;
    if (computeIndicesMapping)
      utf8OffsetToUtf16[utf8Length] = utf16Length;
    const utf8Value = new Uint8Array(utf8Length);
    let i8 = 0;
    for (let i16 = 0; i16 < utf16Length; i16++) {
      const charCode = str.charCodeAt(i16);
      let codePoint = charCode;
      let wasSurrogatePair = false;
      if (charCode >= 55296 && charCode <= 56319) {
        if (i16 + 1 < utf16Length) {
          const nextCharCode = str.charCodeAt(i16 + 1);
          if (nextCharCode >= 56320 && nextCharCode <= 57343) {
            codePoint = (charCode - 55296 << 10) + 65536 | nextCharCode - 56320;
            wasSurrogatePair = true;
          }
        }
      }
      if (computeIndicesMapping) {
        utf16OffsetToUtf8[i16] = i8;
        if (wasSurrogatePair)
          utf16OffsetToUtf8[i16 + 1] = i8;
        if (codePoint <= 127) {
          utf8OffsetToUtf16[i8 + 0] = i16;
        } else if (codePoint <= 2047) {
          utf8OffsetToUtf16[i8 + 0] = i16;
          utf8OffsetToUtf16[i8 + 1] = i16;
        } else if (codePoint <= 65535) {
          utf8OffsetToUtf16[i8 + 0] = i16;
          utf8OffsetToUtf16[i8 + 1] = i16;
          utf8OffsetToUtf16[i8 + 2] = i16;
        } else {
          utf8OffsetToUtf16[i8 + 0] = i16;
          utf8OffsetToUtf16[i8 + 1] = i16;
          utf8OffsetToUtf16[i8 + 2] = i16;
          utf8OffsetToUtf16[i8 + 3] = i16;
        }
      }
      if (codePoint <= 127) {
        utf8Value[i8++] = codePoint;
      } else if (codePoint <= 2047) {
        utf8Value[i8++] = 192 | (codePoint & 1984) >>> 6;
        utf8Value[i8++] = 128 | (codePoint & 63) >>> 0;
      } else if (codePoint <= 65535) {
        utf8Value[i8++] = 224 | (codePoint & 61440) >>> 12;
        utf8Value[i8++] = 128 | (codePoint & 4032) >>> 6;
        utf8Value[i8++] = 128 | (codePoint & 63) >>> 0;
      } else {
        utf8Value[i8++] = 240 | (codePoint & 1835008) >>> 18;
        utf8Value[i8++] = 128 | (codePoint & 258048) >>> 12;
        utf8Value[i8++] = 128 | (codePoint & 4032) >>> 6;
        utf8Value[i8++] = 128 | (codePoint & 63) >>> 0;
      }
      if (wasSurrogatePair)
        i16++;
    }
    this.utf16Length = utf16Length;
    this.utf8Length = utf8Length;
    this.utf16Value = str;
    this.utf8Value = utf8Value;
    this.utf16OffsetToUtf8 = utf16OffsetToUtf8;
    this.utf8OffsetToUtf16 = utf8OffsetToUtf16;
  }
  createString(onigBinding2) {
    const result = onigBinding2._omalloc(this.utf8Length);
    onigBinding2.HEAPU8.set(this.utf8Value, result);
    return result;
  }
}
const _OnigString = class _OnigString {
  constructor(str) {
    this.id = ++_OnigString.LAST_ID;
    if (!onigBinding)
      throw new Error("Must invoke loadWasm first.");
    this._onigBinding = onigBinding;
    this.content = str;
    const utfString = new UtfString(str);
    this.utf16Length = utfString.utf16Length;
    this.utf8Length = utfString.utf8Length;
    this.utf16OffsetToUtf8 = utfString.utf16OffsetToUtf8;
    this.utf8OffsetToUtf16 = utfString.utf8OffsetToUtf16;
    if (this.utf8Length < 1e4 && !_OnigString._sharedPtrInUse) {
      if (!_OnigString._sharedPtr)
        _OnigString._sharedPtr = onigBinding._omalloc(1e4);
      _OnigString._sharedPtrInUse = true;
      onigBinding.HEAPU8.set(utfString.utf8Value, _OnigString._sharedPtr);
      this.ptr = _OnigString._sharedPtr;
    } else {
      this.ptr = utfString.createString(onigBinding);
    }
  }
  convertUtf8OffsetToUtf16(utf8Offset) {
    if (this.utf8OffsetToUtf16) {
      if (utf8Offset < 0)
        return 0;
      if (utf8Offset > this.utf8Length)
        return this.utf16Length;
      return this.utf8OffsetToUtf16[utf8Offset];
    }
    return utf8Offset;
  }
  convertUtf16OffsetToUtf8(utf16Offset) {
    if (this.utf16OffsetToUtf8) {
      if (utf16Offset < 0)
        return 0;
      if (utf16Offset > this.utf16Length)
        return this.utf8Length;
      return this.utf16OffsetToUtf8[utf16Offset];
    }
    return utf16Offset;
  }
  dispose() {
    if (this.ptr === _OnigString._sharedPtr)
      _OnigString._sharedPtrInUse = false;
    else
      this._onigBinding._ofree(this.ptr);
  }
};
_OnigString.LAST_ID = 0;
_OnigString._sharedPtr = 0;
// a pointer to a string of 10000 bytes
_OnigString._sharedPtrInUse = false;
let OnigString = _OnigString;
class OnigScanner {
  constructor(patterns) {
    if (!onigBinding)
      throw new Error("Must invoke loadWasm first.");
    const strPtrsArr = [];
    const strLenArr = [];
    for (let i = 0, len = patterns.length; i < len; i++) {
      const utfString = new UtfString(patterns[i]);
      strPtrsArr[i] = utfString.createString(onigBinding);
      strLenArr[i] = utfString.utf8Length;
    }
    const strPtrsPtr = onigBinding._omalloc(4 * patterns.length);
    onigBinding.HEAPU32.set(strPtrsArr, strPtrsPtr / 4);
    const strLenPtr = onigBinding._omalloc(4 * patterns.length);
    onigBinding.HEAPU32.set(strLenArr, strLenPtr / 4);
    const scannerPtr = onigBinding._createOnigScanner(strPtrsPtr, strLenPtr, patterns.length);
    for (let i = 0, len = patterns.length; i < len; i++)
      onigBinding._ofree(strPtrsArr[i]);
    onigBinding._ofree(strLenPtr);
    onigBinding._ofree(strPtrsPtr);
    if (scannerPtr === 0)
      throwLastOnigError(onigBinding);
    this._onigBinding = onigBinding;
    this._ptr = scannerPtr;
  }
  dispose() {
    this._onigBinding._freeOnigScanner(this._ptr);
  }
  findNextMatchSync(string, startPosition, arg) {
    let debugCall = defaultDebugCall;
    let options = 0 /* None */;
    if (typeof arg === "number") {
      if (arg & 8 /* DebugCall */)
        debugCall = true;
      options = arg;
    } else if (typeof arg === "boolean") {
      debugCall = arg;
    }
    if (typeof string === "string") {
      string = new OnigString(string);
      const result = this._findNextMatchSync(string, startPosition, debugCall, options);
      string.dispose();
      return result;
    }
    return this._findNextMatchSync(string, startPosition, debugCall, options);
  }
  _findNextMatchSync(string, startPosition, debugCall, options) {
    const onigBinding2 = this._onigBinding;
    let resultPtr;
    if (debugCall)
      resultPtr = onigBinding2._findNextOnigScannerMatchDbg(this._ptr, string.id, string.ptr, string.utf8Length, string.convertUtf16OffsetToUtf8(startPosition), options);
    else
      resultPtr = onigBinding2._findNextOnigScannerMatch(this._ptr, string.id, string.ptr, string.utf8Length, string.convertUtf16OffsetToUtf8(startPosition), options);
    if (resultPtr === 0) {
      return null;
    }
    const HEAPU32 = onigBinding2.HEAPU32;
    let offset = resultPtr / 4;
    const index = HEAPU32[offset++];
    const count = HEAPU32[offset++];
    const captureIndices = [];
    for (let i = 0; i < count; i++) {
      const beg = string.convertUtf8OffsetToUtf16(HEAPU32[offset++]);
      const end = string.convertUtf8OffsetToUtf16(HEAPU32[offset++]);
      captureIndices[i] = {
        start: beg,
        end,
        length: end - beg
      };
    }
    return {
      index,
      captureIndices
    };
  }
}
async function _loadWasm(loader, print) {
  onigBinding = await main$1({
    print,
    instantiateWasm: (importObject) => {
      if (typeof performance === "undefined") {
        const get_now = () => Date.now();
        importObject.env.emscripten_get_now = get_now;
        importObject.wasi_snapshot_preview1.emscripten_get_now = get_now;
      }
      return loader(importObject).then((instantiatedSource) => instantiatedSource.instance || instantiatedSource);
    }
  });
}
function isInstantiatorOptionsObject(dataOrOptions) {
  return typeof dataOrOptions.instantiator === "function";
}
function isDataOptionsObject(dataOrOptions) {
  return typeof dataOrOptions.data !== "undefined";
}
function isResponse(dataOrOptions) {
  return typeof Response !== "undefined" && dataOrOptions instanceof Response;
}
let initCalled = false;
let initPromise = null;
function loadWasm(dataOrOptions) {
  if (initCalled) {
    return initPromise;
  }
  initCalled = true;
  let loader;
  let print;
  if (typeof dataOrOptions === "function") {
    loader = dataOrOptions;
  } else if (isInstantiatorOptionsObject(dataOrOptions)) {
    loader = dataOrOptions.instantiator;
    print = dataOrOptions.print;
  } else {
    let data;
    if (isDataOptionsObject(dataOrOptions)) {
      data = dataOrOptions.data;
      print = dataOrOptions.print;
    } else {
      data = dataOrOptions;
    }
    if (isResponse(data)) {
      if (typeof WebAssembly.instantiateStreaming === "function")
        loader = _makeResponseStreamingLoader(data);
      else
        loader = _makeResponseNonStreamingLoader(data);
    } else {
      loader = _makeArrayBufferLoader(data);
    }
  }
  initPromise = _loadWasm(loader, print);
  return initPromise;
}
function _makeArrayBufferLoader(data) {
  return (importObject) => WebAssembly.instantiate(data, importObject);
}
function _makeResponseStreamingLoader(data) {
  return (importObject) => WebAssembly.instantiateStreaming(data, importObject);
}
function _makeResponseNonStreamingLoader(data) {
  return async (importObject) => {
    const arrayBuffer = await data.arrayBuffer();
    return WebAssembly.instantiate(arrayBuffer, importObject);
  };
}
function createOnigString(str) {
  return new OnigString(str);
}
function createOnigScanner(patterns) {
  return new OnigScanner(patterns);
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var main = {exports: {}};

(function (module, exports) {
	!function(e,t){module.exports=t();}(commonjsGlobal,(function(){return (()=>{var e={350:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UseOnigurumaFindOptions=t.DebugFlags=void 0,t.DebugFlags={InDebugMode:"undefined"!=typeof process&&!!process.env.VSCODE_TEXTMATE_DEBUG},t.UseOnigurumaFindOptions=!1;},442:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.applyStateStackDiff=t.diffStateStacksRefEq=void 0;const s=n(391);t.diffStateStacksRefEq=function(e,t){let n=0;const s=[];let r=e,i=t;for(;r!==i;)r&&(!i||r.depth>=i.depth)?(n++,r=r.parent):(s.push(i.toStateStackFrame()),i=i.parent);return {pops:n,newFrames:s.reverse()}},t.applyStateStackDiff=function(e,t){let n=e;for(let e=0;e<t.pops;e++)n=n.parent;for(const e of t.newFrames)n=s.StateStackImpl.pushFrame(n,e);return n};},36:(e,t)=>{var n;Object.defineProperty(t,"__esModule",{value:!0}),t.toOptionalTokenType=t.EncodedTokenAttributes=void 0,(n=t.EncodedTokenAttributes||(t.EncodedTokenAttributes={})).toBinaryStr=function(e){let t=e.toString(2);for(;t.length<32;)t="0"+t;return t},n.print=function(e){const t=n.getLanguageId(e),s=n.getTokenType(e),r=n.getFontStyle(e),i=n.getForeground(e),o=n.getBackground(e);console.log({languageId:t,tokenType:s,fontStyle:r,foreground:i,background:o});},n.getLanguageId=function(e){return (255&e)>>>0},n.getTokenType=function(e){return (768&e)>>>8},n.containsBalancedBrackets=function(e){return 0!=(1024&e)},n.getFontStyle=function(e){return (30720&e)>>>11},n.getForeground=function(e){return (16744448&e)>>>15},n.getBackground=function(e){return (4278190080&e)>>>24},n.set=function(e,t,s,r,i,o,a){let c=n.getLanguageId(e),l=n.getTokenType(e),u=n.containsBalancedBrackets(e)?1:0,h=n.getFontStyle(e),p=n.getForeground(e),d=n.getBackground(e);return 0!==t&&(c=t),8!==s&&(l=s),null!==r&&(u=r?1:0),-1!==i&&(h=i),0!==o&&(p=o),0!==a&&(d=a),(c<<0|l<<8|u<<10|h<<11|p<<15|d<<24)>>>0},t.toOptionalTokenType=function(e){return e};},996:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.BasicScopeAttributesProvider=t.BasicScopeAttributes=void 0;const s=n(878);class r{constructor(e,t){this.languageId=e,this.tokenType=t;}}t.BasicScopeAttributes=r;class i{constructor(e,t){this._getBasicScopeAttributes=new s.CachedFn((e=>{const t=this._scopeToLanguage(e),n=this._toStandardTokenType(e);return new r(t,n)})),this._defaultAttributes=new r(e,8),this._embeddedLanguagesMatcher=new o(Object.entries(t||{}));}getDefaultAttributes(){return this._defaultAttributes}getBasicScopeAttributes(e){return null===e?i._NULL_SCOPE_METADATA:this._getBasicScopeAttributes.get(e)}_scopeToLanguage(e){return this._embeddedLanguagesMatcher.match(e)||0}_toStandardTokenType(e){const t=e.match(i.STANDARD_TOKEN_TYPE_REGEXP);if(!t)return 8;switch(t[1]){case"comment":return 1;case"string":return 2;case"regex":return 3;case"meta.embedded":return 0}throw new Error("Unexpected match for standard token type!")}}t.BasicScopeAttributesProvider=i,i._NULL_SCOPE_METADATA=new r(0,0),i.STANDARD_TOKEN_TYPE_REGEXP=/\b(comment|string|regex|meta\.embedded)\b/;class o{constructor(e){if(0===e.length)this.values=null,this.scopesRegExp=null;else {this.values=new Map(e);const t=e.map((([e,t])=>s.escapeRegExpCharacters(e)));t.sort(),t.reverse(),this.scopesRegExp=new RegExp(`^((${t.join(")|(")}))($|\\.)`,"");}}match(e){if(!this.scopesRegExp)return;const t=e.match(this.scopesRegExp);return t?this.values.get(t[1]):void 0}}},947:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.LineTokens=t.BalancedBracketSelectors=t.StateStackImpl=t.AttributedScopeStack=t.Grammar=t.createGrammar=void 0;const s=n(350),r=n(36),i=n(736),o=n(44),a=n(792),c=n(583),l=n(878),u=n(996),h=n(47);function p(e,t,n,s,r){const o=i.createMatchers(t,d),c=a.RuleFactory.getCompiledRuleId(n,s,r.repository);for(const n of o)e.push({debugSelector:t,matcher:n.matcher,ruleId:c,grammar:r,priority:n.priority});}function d(e,t){if(t.length<e.length)return !1;let n=0;return e.every((e=>{for(let s=n;s<t.length;s++)if(f(t[s],e))return n=s+1,!0;return !1}))}function f(e,t){if(!e)return !1;if(e===t)return !0;const n=t.length;return e.length>n&&e.substr(0,n)===t&&"."===e[n]}t.createGrammar=function(e,t,n,s,r,i,o,a){return new m(e,t,n,s,r,i,o,a)};class m{constructor(e,t,n,s,r,o,a,c){if(this._rootScopeName=e,this.balancedBracketSelectors=o,this._onigLib=c,this._basicScopeAttributesProvider=new u.BasicScopeAttributesProvider(n,s),this._rootId=-1,this._lastRuleId=0,this._ruleId2desc=[null],this._includedGrammars={},this._grammarRepository=a,this._grammar=g(t,null),this._injections=null,this._tokenTypeMatchers=[],r)for(const e of Object.keys(r)){const t=i.createMatchers(e,d);for(const n of t)this._tokenTypeMatchers.push({matcher:n.matcher,type:r[e]});}}get themeProvider(){return this._grammarRepository}dispose(){for(const e of this._ruleId2desc)e&&e.dispose();}createOnigScanner(e){return this._onigLib.createOnigScanner(e)}createOnigString(e){return this._onigLib.createOnigString(e)}getMetadataForScope(e){return this._basicScopeAttributesProvider.getBasicScopeAttributes(e)}_collectInjections(){const e=[],t=this._rootScopeName,n=(e=>e===this._rootScopeName?this._grammar:this.getExternalGrammar(e))(t);if(n){const s=n.injections;if(s)for(let t in s)p(e,t,s[t],this,n);const r=this._grammarRepository.injections(t);r&&r.forEach((t=>{const n=this.getExternalGrammar(t);if(n){const t=n.injectionSelector;t&&p(e,t,n,this,n);}}));}return e.sort(((e,t)=>e.priority-t.priority)),e}getInjections(){if(null===this._injections&&(this._injections=this._collectInjections(),s.DebugFlags.InDebugMode&&this._injections.length>0)){console.log(`Grammar ${this._rootScopeName} contains the following injections:`);for(const e of this._injections)console.log(`  - ${e.debugSelector}`);}return this._injections}registerRule(e){const t=++this._lastRuleId,n=e(a.ruleIdFromNumber(t));return this._ruleId2desc[t]=n,n}getRule(e){return this._ruleId2desc[a.ruleIdToNumber(e)]}getExternalGrammar(e,t){if(this._includedGrammars[e])return this._includedGrammars[e];if(this._grammarRepository){const n=this._grammarRepository.lookup(e);if(n)return this._includedGrammars[e]=g(n,t&&t.$base),this._includedGrammars[e]}}tokenizeLine(e,t,n=0){const s=this._tokenize(e,t,!1,n);return {tokens:s.lineTokens.getResult(s.ruleStack,s.lineLength),ruleStack:s.ruleStack,stoppedEarly:s.stoppedEarly}}tokenizeLine2(e,t,n=0){const s=this._tokenize(e,t,!0,n);return {tokens:s.lineTokens.getBinaryResult(s.ruleStack,s.lineLength),ruleStack:s.ruleStack,stoppedEarly:s.stoppedEarly}}_tokenize(e,t,n,s){let i;if(-1===this._rootId&&(this._rootId=a.RuleFactory.getCompiledRuleId(this._grammar.repository.$self,this,this._grammar.repository),this.getInjections()),t&&t!==b.NULL)i=!1,t.reset();else {i=!0;const e=this._basicScopeAttributesProvider.getDefaultAttributes(),n=this.themeProvider.getDefaults(),s=r.EncodedTokenAttributes.set(0,e.languageId,e.tokenType,null,n.fontStyle,n.foregroundId,n.backgroundId),o=this.getRule(this._rootId).getName(null,null);let a;a=o?_.createRootAndLookUpScopeName(o,s,this):_.createRoot("unknown",s),t=new b(null,this._rootId,-1,-1,!1,null,a,a);}e+="\n";const c=this.createOnigString(e),l=c.content.length,u=new y(n,e,this._tokenTypeMatchers,this.balancedBracketSelectors),p=h._tokenizeString(this,c,i,0,t,u,!0,s);return o.disposeOnigString(c),{lineLength:l,lineTokens:u,ruleStack:p.stack,stoppedEarly:p.stoppedEarly}}}function g(e,t){return (e=l.clone(e)).repository=e.repository||{},e.repository.$self={$vscodeTextmateLocation:e.$vscodeTextmateLocation,patterns:e.patterns,name:e.scopeName},e.repository.$base=t||e.repository.$self,e}t.Grammar=m;class _{constructor(e,t,n){this.parent=e,this.scopePath=t,this.tokenAttributes=n;}static fromExtension(e,t){let n=e,s=e?.scopePath??null;for(const e of t)s=c.ScopeStack.push(s,e.scopeNames),n=new _(n,s,e.encodedTokenAttributes);return n}static createRoot(e,t){return new _(null,new c.ScopeStack(null,e),t)}static createRootAndLookUpScopeName(e,t,n){const s=n.getMetadataForScope(e),r=new c.ScopeStack(null,e),i=n.themeProvider.themeMatch(r),o=_.mergeAttributes(t,s,i);return new _(null,r,o)}get scopeName(){return this.scopePath.scopeName}toString(){return this.getScopeNames().join(" ")}equals(e){return _.equals(this,e)}static equals(e,t){for(;;){if(e===t)return !0;if(!e&&!t)return !0;if(!e||!t)return !1;if(e.scopeName!==t.scopeName||e.tokenAttributes!==t.tokenAttributes)return !1;e=e.parent,t=t.parent;}}static mergeAttributes(e,t,n){let s=-1,i=0,o=0;return null!==n&&(s=n.fontStyle,i=n.foregroundId,o=n.backgroundId),r.EncodedTokenAttributes.set(e,t.languageId,t.tokenType,null,s,i,o)}pushAttributed(e,t){if(null===e)return this;if(-1===e.indexOf(" "))return _._pushAttributed(this,e,t);const n=e.split(/ /g);let s=this;for(const e of n)s=_._pushAttributed(s,e,t);return s}static _pushAttributed(e,t,n){const s=n.getMetadataForScope(t),r=e.scopePath.push(t),i=n.themeProvider.themeMatch(r),o=_.mergeAttributes(e.tokenAttributes,s,i);return new _(e,r,o)}getScopeNames(){return this.scopePath.getSegments()}getExtensionIfDefined(e){const t=[];let n=this;for(;n&&n!==e;)t.push({encodedTokenAttributes:n.tokenAttributes,scopeNames:n.scopePath.getExtensionIfDefined(n.parent?.scopePath??null)}),n=n.parent;return n===e?t.reverse():void 0}}t.AttributedScopeStack=_;class b{constructor(e,t,n,s,r,i,o,a){this.parent=e,this.ruleId=t,this.beginRuleCapturedEOL=r,this.endRule=i,this.nameScopesList=o,this.contentNameScopesList=a,this._stackElementBrand=void 0,this.depth=this.parent?this.parent.depth+1:1,this._enterPos=n,this._anchorPos=s;}equals(e){return null!==e&&b._equals(this,e)}static _equals(e,t){return e===t||!!this._structuralEquals(e,t)&&_.equals(e.contentNameScopesList,t.contentNameScopesList)}static _structuralEquals(e,t){for(;;){if(e===t)return !0;if(!e&&!t)return !0;if(!e||!t)return !1;if(e.depth!==t.depth||e.ruleId!==t.ruleId||e.endRule!==t.endRule)return !1;e=e.parent,t=t.parent;}}clone(){return this}static _reset(e){for(;e;)e._enterPos=-1,e._anchorPos=-1,e=e.parent;}reset(){b._reset(this);}pop(){return this.parent}safePop(){return this.parent?this.parent:this}push(e,t,n,s,r,i,o){return new b(this,e,t,n,s,r,i,o)}getEnterPos(){return this._enterPos}getAnchorPos(){return this._anchorPos}getRule(e){return e.getRule(this.ruleId)}toString(){const e=[];return this._writeString(e,0),"["+e.join(",")+"]"}_writeString(e,t){return this.parent&&(t=this.parent._writeString(e,t)),e[t++]=`(${this.ruleId}, ${this.nameScopesList?.toString()}, ${this.contentNameScopesList?.toString()})`,t}withContentNameScopesList(e){return this.contentNameScopesList===e?this:this.parent.push(this.ruleId,this._enterPos,this._anchorPos,this.beginRuleCapturedEOL,this.endRule,this.nameScopesList,e)}withEndRule(e){return this.endRule===e?this:new b(this.parent,this.ruleId,this._enterPos,this._anchorPos,this.beginRuleCapturedEOL,e,this.nameScopesList,this.contentNameScopesList)}hasSameRuleAs(e){let t=this;for(;t&&t._enterPos===e._enterPos;){if(t.ruleId===e.ruleId)return !0;t=t.parent;}return !1}toStateStackFrame(){return {ruleId:a.ruleIdToNumber(this.ruleId),beginRuleCapturedEOL:this.beginRuleCapturedEOL,endRule:this.endRule,nameScopesList:this.nameScopesList?.getExtensionIfDefined(this.parent?.nameScopesList??null)??[],contentNameScopesList:this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList)??[]}}static pushFrame(e,t){const n=_.fromExtension(e?.nameScopesList??null,t.nameScopesList);return new b(e,a.ruleIdFromNumber(t.ruleId),t.enterPos??-1,t.anchorPos??-1,t.beginRuleCapturedEOL,t.endRule,n,_.fromExtension(n,t.contentNameScopesList))}}t.StateStackImpl=b,b.NULL=new b(null,0,0,0,!1,null,null,null),t.BalancedBracketSelectors=class{constructor(e,t){this.allowAny=!1,this.balancedBracketScopes=e.flatMap((e=>"*"===e?(this.allowAny=!0,[]):i.createMatchers(e,d).map((e=>e.matcher)))),this.unbalancedBracketScopes=t.flatMap((e=>i.createMatchers(e,d).map((e=>e.matcher))));}get matchesAlways(){return this.allowAny&&0===this.unbalancedBracketScopes.length}get matchesNever(){return 0===this.balancedBracketScopes.length&&!this.allowAny}match(e){for(const t of this.unbalancedBracketScopes)if(t(e))return !1;for(const t of this.balancedBracketScopes)if(t(e))return !0;return this.allowAny}};class y{constructor(e,t,n,r){this.balancedBracketSelectors=r,this._emitBinaryTokens=e,this._tokenTypeOverrides=n,s.DebugFlags.InDebugMode?this._lineText=t:this._lineText=null,this._tokens=[],this._binaryTokens=[],this._lastTokenEndIndex=0;}produce(e,t){this.produceFromScopes(e.contentNameScopesList,t);}produceFromScopes(e,t){if(this._lastTokenEndIndex>=t)return;if(this._emitBinaryTokens){let n=e?.tokenAttributes??0,i=!1;if(this.balancedBracketSelectors?.matchesAlways&&(i=!0),this._tokenTypeOverrides.length>0||this.balancedBracketSelectors&&!this.balancedBracketSelectors.matchesAlways&&!this.balancedBracketSelectors.matchesNever){const t=e?.getScopeNames()??[];for(const e of this._tokenTypeOverrides)e.matcher(t)&&(n=r.EncodedTokenAttributes.set(n,0,r.toOptionalTokenType(e.type),null,-1,0,0));this.balancedBracketSelectors&&(i=this.balancedBracketSelectors.match(t));}if(i&&(n=r.EncodedTokenAttributes.set(n,0,8,i,-1,0,0)),this._binaryTokens.length>0&&this._binaryTokens[this._binaryTokens.length-1]===n)return void(this._lastTokenEndIndex=t);if(s.DebugFlags.InDebugMode){const n=e?.getScopeNames()??[];console.log("  token: |"+this._lineText.substring(this._lastTokenEndIndex,t).replace(/\n$/,"\\n")+"|");for(let e=0;e<n.length;e++)console.log("      * "+n[e]);}return this._binaryTokens.push(this._lastTokenEndIndex),this._binaryTokens.push(n),void(this._lastTokenEndIndex=t)}const n=e?.getScopeNames()??[];if(s.DebugFlags.InDebugMode){console.log("  token: |"+this._lineText.substring(this._lastTokenEndIndex,t).replace(/\n$/,"\\n")+"|");for(let e=0;e<n.length;e++)console.log("      * "+n[e]);}this._tokens.push({startIndex:this._lastTokenEndIndex,endIndex:t,scopes:n}),this._lastTokenEndIndex=t;}getResult(e,t){return this._tokens.length>0&&this._tokens[this._tokens.length-1].startIndex===t-1&&this._tokens.pop(),0===this._tokens.length&&(this._lastTokenEndIndex=-1,this.produce(e,t),this._tokens[this._tokens.length-1].startIndex=0),this._tokens}getBinaryResult(e,t){this._binaryTokens.length>0&&this._binaryTokens[this._binaryTokens.length-2]===t-1&&(this._binaryTokens.pop(),this._binaryTokens.pop()),0===this._binaryTokens.length&&(this._lastTokenEndIndex=-1,this.produce(e,t),this._binaryTokens[this._binaryTokens.length-2]=0);const n=new Uint32Array(this._binaryTokens.length);for(let e=0,t=this._binaryTokens.length;e<t;e++)n[e]=this._binaryTokens[e];return n}}t.LineTokens=y;},965:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.parseInclude=t.TopLevelRepositoryReference=t.TopLevelReference=t.RelativeReference=t.SelfReference=t.BaseReference=t.ScopeDependencyProcessor=t.ExternalReferenceCollector=t.TopLevelRepositoryRuleReference=t.TopLevelRuleReference=void 0;const s=n(878);class r{constructor(e){this.scopeName=e;}toKey(){return this.scopeName}}t.TopLevelRuleReference=r;class i{constructor(e,t){this.scopeName=e,this.ruleName=t;}toKey(){return `${this.scopeName}#${this.ruleName}`}}t.TopLevelRepositoryRuleReference=i;class o{constructor(){this._references=[],this._seenReferenceKeys=new Set,this.visitedRule=new Set;}get references(){return this._references}add(e){const t=e.toKey();this._seenReferenceKeys.has(t)||(this._seenReferenceKeys.add(t),this._references.push(e));}}function a(e,t,n,s){const i=n.lookup(e.scopeName);if(!i){if(e.scopeName===t)throw new Error(`No grammar provided for <${t}>`);return}const o=n.lookup(t);e instanceof r?l({baseGrammar:o,selfGrammar:i},s):c(e.ruleName,{baseGrammar:o,selfGrammar:i,repository:i.repository},s);const a=n.injections(e.scopeName);if(a)for(const e of a)s.add(new r(e));}function c(e,t,n){t.repository&&t.repository[e]&&u([t.repository[e]],t,n);}function l(e,t){e.selfGrammar.patterns&&Array.isArray(e.selfGrammar.patterns)&&u(e.selfGrammar.patterns,{...e,repository:e.selfGrammar.repository},t),e.selfGrammar.injections&&u(Object.values(e.selfGrammar.injections),{...e,repository:e.selfGrammar.repository},t);}function u(e,t,n){for(const o of e){if(n.visitedRule.has(o))continue;n.visitedRule.add(o);const e=o.repository?s.mergeObjects({},t.repository,o.repository):t.repository;Array.isArray(o.patterns)&&u(o.patterns,{...t,repository:e},n);const a=o.include;if(!a)continue;const h=g(a);switch(h.kind){case 0:l({...t,selfGrammar:t.baseGrammar},n);break;case 1:l(t,n);break;case 2:c(h.ruleName,{...t,repository:e},n);break;case 3:case 4:const s=h.scopeName===t.selfGrammar.scopeName?t.selfGrammar:h.scopeName===t.baseGrammar.scopeName?t.baseGrammar:void 0;if(s){const r={baseGrammar:t.baseGrammar,selfGrammar:s,repository:e};4===h.kind?c(h.ruleName,r,n):l(r,n);}else 4===h.kind?n.add(new i(h.scopeName,h.ruleName)):n.add(new r(h.scopeName));}}}t.ExternalReferenceCollector=o,t.ScopeDependencyProcessor=class{constructor(e,t){this.repo=e,this.initialScopeName=t,this.seenFullScopeRequests=new Set,this.seenPartialScopeRequests=new Set,this.seenFullScopeRequests.add(this.initialScopeName),this.Q=[new r(this.initialScopeName)];}processQueue(){const e=this.Q;this.Q=[];const t=new o;for(const n of e)a(n,this.initialScopeName,this.repo,t);for(const e of t.references)if(e instanceof r){if(this.seenFullScopeRequests.has(e.scopeName))continue;this.seenFullScopeRequests.add(e.scopeName),this.Q.push(e);}else {if(this.seenFullScopeRequests.has(e.scopeName))continue;if(this.seenPartialScopeRequests.has(e.toKey()))continue;this.seenPartialScopeRequests.add(e.toKey()),this.Q.push(e);}}};class h{constructor(){this.kind=0;}}t.BaseReference=h;class p{constructor(){this.kind=1;}}t.SelfReference=p;class d{constructor(e){this.ruleName=e,this.kind=2;}}t.RelativeReference=d;class f{constructor(e){this.scopeName=e,this.kind=3;}}t.TopLevelReference=f;class m{constructor(e,t){this.scopeName=e,this.ruleName=t,this.kind=4;}}function g(e){if("$base"===e)return new h;if("$self"===e)return new p;const t=e.indexOf("#");if(-1===t)return new f(e);if(0===t)return new d(e.substring(1));{const n=e.substring(0,t),s=e.substring(t+1);return new m(n,s)}}t.TopLevelRepositoryReference=m,t.parseInclude=g;},391:function(e,t,n){var s=this&&this.__createBinding||(Object.create?function(e,t,n,s){void 0===s&&(s=n),Object.defineProperty(e,s,{enumerable:!0,get:function(){return t[n]}});}:function(e,t,n,s){void 0===s&&(s=n),e[s]=t[n];}),r=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||s(t,e,n);};Object.defineProperty(t,"__esModule",{value:!0}),r(n(947),t);},47:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.LocalStackElement=t._tokenizeString=void 0;const s=n(350),r=n(44),i=n(792),o=n(878);class a{constructor(e,t){this.stack=e,this.stoppedEarly=t;}}function c(e,t,n,r,c,h,d,f){const m=t.content.length;let g=!1,_=-1;if(d){const o=function(e,t,n,r,o,a){let c=o.beginRuleCapturedEOL?0:-1;const l=[];for(let t=o;t;t=t.pop()){const n=t.getRule(e);n instanceof i.BeginWhileRule&&l.push({rule:n,stack:t});}for(let h=l.pop();h;h=l.pop()){const{ruleScanner:l,findOptions:d}=u(h.rule,e,h.stack.endRule,n,r===c),f=l.findNextMatchSync(t,r,d);if(s.DebugFlags.InDebugMode&&(console.log("  scanning for while rule"),console.log(l.toString())),!f){s.DebugFlags.InDebugMode&&console.log("  popping "+h.rule.debugName+" - "+h.rule.debugWhileRegExp),o=h.stack.pop();break}if(f.ruleId!==i.whileRuleId){o=h.stack.pop();break}f.captureIndices&&f.captureIndices.length&&(a.produce(h.stack,f.captureIndices[0].start),p(e,t,n,h.stack,a,h.rule.whileCaptures,f.captureIndices),a.produce(h.stack,f.captureIndices[0].end),c=f.captureIndices[0].end,f.captureIndices[0].end>r&&(r=f.captureIndices[0].end,n=!1));}return {stack:o,linePos:r,anchorPosition:c,isFirstLine:n}}(e,t,n,r,c,h);c=o.stack,r=o.linePos,n=o.isFirstLine,_=o.anchorPosition;}const b=Date.now();for(;!g;){if(0!==f&&Date.now()-b>f)return new a(c,!0);y();}return new a(c,!1);function y(){s.DebugFlags.InDebugMode&&(console.log(""),console.log(`@@scanNext ${r}: |${t.content.substr(r).replace(/\n$/,"\\n")}|`));const a=function(e,t,n,r,i,a){const c=function(e,t,n,r,i,a){const c=i.getRule(e),{ruleScanner:u,findOptions:h}=l(c,e,i.endRule,n,r===a);let p=0;s.DebugFlags.InDebugMode&&(p=o.performanceNow());const d=u.findNextMatchSync(t,r,h);if(s.DebugFlags.InDebugMode){const e=o.performanceNow()-p;e>5&&console.warn(`Rule ${c.debugName} (${c.id}) matching took ${e} against '${t}'`),console.log(`  scanning for (linePos: ${r}, anchorPosition: ${a})`),console.log(u.toString()),d&&console.log(`matched rule id: ${d.ruleId} from ${d.captureIndices[0].start} to ${d.captureIndices[0].end}`);}return d?{captureIndices:d.captureIndices,matchedRuleId:d.ruleId}:null}(e,t,n,r,i,a),u=e.getInjections();if(0===u.length)return c;const h=function(e,t,n,r,i,o,a){let c,u=Number.MAX_VALUE,h=null,p=0;const d=o.contentNameScopesList.getScopeNames();for(let o=0,f=e.length;o<f;o++){const f=e[o];if(!f.matcher(d))continue;const m=t.getRule(f.ruleId),{ruleScanner:g,findOptions:_}=l(m,t,null,r,i===a),b=g.findNextMatchSync(n,i,_);if(!b)continue;s.DebugFlags.InDebugMode&&(console.log(`  matched injection: ${f.debugSelector}`),console.log(g.toString()));const y=b.captureIndices[0].start;if(!(y>=u)&&(u=y,h=b.captureIndices,c=b.ruleId,p=f.priority,u===i))break}return h?{priorityMatch:-1===p,captureIndices:h,matchedRuleId:c}:null}(u,e,t,n,r,i,a);if(!h)return c;if(!c)return h;const p=c.captureIndices[0].start,d=h.captureIndices[0].start;return d<p||h.priorityMatch&&d===p?h:c}(e,t,n,r,c,_);if(!a)return s.DebugFlags.InDebugMode&&console.log("  no more matches."),h.produce(c,m),void(g=!0);const u=a.captureIndices,d=a.matchedRuleId,f=!!(u&&u.length>0)&&u[0].end>r;if(d===i.endRuleId){const i=c.getRule(e);s.DebugFlags.InDebugMode&&console.log("  popping "+i.debugName+" - "+i.debugEndRegExp),h.produce(c,u[0].start),c=c.withContentNameScopesList(c.nameScopesList),p(e,t,n,c,h,i.endCaptures,u),h.produce(c,u[0].end);const o=c;if(c=c.parent,_=o.getAnchorPos(),!f&&o.getEnterPos()===r)return s.DebugFlags.InDebugMode&&console.error("[1] - Grammar is in an endless loop - Grammar pushed & popped a rule without advancing"),c=o,h.produce(c,m),void(g=!0)}else {const o=e.getRule(d);h.produce(c,u[0].start);const a=c,l=o.getName(t.content,u),b=c.contentNameScopesList.pushAttributed(l,e);if(c=c.push(d,r,_,u[0].end===m,null,b,b),o instanceof i.BeginEndRule){const r=o;s.DebugFlags.InDebugMode&&console.log("  pushing "+r.debugName+" - "+r.debugBeginRegExp),p(e,t,n,c,h,r.beginCaptures,u),h.produce(c,u[0].end),_=u[0].end;const i=r.getContentName(t.content,u),l=b.pushAttributed(i,e);if(c=c.withContentNameScopesList(l),r.endHasBackReferences&&(c=c.withEndRule(r.getEndWithResolvedBackReferences(t.content,u))),!f&&a.hasSameRuleAs(c))return s.DebugFlags.InDebugMode&&console.error("[2] - Grammar is in an endless loop - Grammar pushed the same rule without advancing"),c=c.pop(),h.produce(c,m),void(g=!0)}else if(o instanceof i.BeginWhileRule){const r=o;s.DebugFlags.InDebugMode&&console.log("  pushing "+r.debugName),p(e,t,n,c,h,r.beginCaptures,u),h.produce(c,u[0].end),_=u[0].end;const i=r.getContentName(t.content,u),l=b.pushAttributed(i,e);if(c=c.withContentNameScopesList(l),r.whileHasBackReferences&&(c=c.withEndRule(r.getWhileWithResolvedBackReferences(t.content,u))),!f&&a.hasSameRuleAs(c))return s.DebugFlags.InDebugMode&&console.error("[3] - Grammar is in an endless loop - Grammar pushed the same rule without advancing"),c=c.pop(),h.produce(c,m),void(g=!0)}else {const r=o;if(s.DebugFlags.InDebugMode&&console.log("  matched "+r.debugName+" - "+r.debugMatchRegExp),p(e,t,n,c,h,r.captures,u),h.produce(c,u[0].end),c=c.pop(),!f)return s.DebugFlags.InDebugMode&&console.error("[4] - Grammar is in an endless loop - Grammar is not advancing, nor is it pushing/popping"),c=c.safePop(),h.produce(c,m),void(g=!0)}}u[0].end>r&&(r=u[0].end,n=!1);}}function l(e,t,n,r,i){return s.UseOnigurumaFindOptions?{ruleScanner:e.compile(t,n),findOptions:h(r,i)}:{ruleScanner:e.compileAG(t,n,r,i),findOptions:0}}function u(e,t,n,r,i){return s.UseOnigurumaFindOptions?{ruleScanner:e.compileWhile(t,n),findOptions:h(r,i)}:{ruleScanner:e.compileWhileAG(t,n,r,i),findOptions:0}}function h(e,t){let n=0;return e||(n|=1),t||(n|=4),n}function p(e,t,n,s,i,o,a){if(0===o.length)return;const l=t.content,u=Math.min(o.length,a.length),h=[],p=a[0].end;for(let t=0;t<u;t++){const u=o[t];if(null===u)continue;const f=a[t];if(0===f.length)continue;if(f.start>p)break;for(;h.length>0&&h[h.length-1].endPos<=f.start;)i.produceFromScopes(h[h.length-1].scopes,h[h.length-1].endPos),h.pop();if(h.length>0?i.produceFromScopes(h[h.length-1].scopes,f.start):i.produce(s,f.start),u.retokenizeCapturedWithRuleId){const t=u.getName(l,a),o=s.contentNameScopesList.pushAttributed(t,e),h=u.getContentName(l,a),p=o.pushAttributed(h,e),d=s.push(u.retokenizeCapturedWithRuleId,f.start,-1,!1,null,o,p),m=e.createOnigString(l.substring(0,f.end));c(e,m,n&&0===f.start,f.start,d,i,!1,0),r.disposeOnigString(m);continue}const m=u.getName(l,a);if(null!==m){const t=(h.length>0?h[h.length-1].scopes:s.contentNameScopesList).pushAttributed(m,e);h.push(new d(t,f.end));}}for(;h.length>0;)i.produceFromScopes(h[h.length-1].scopes,h[h.length-1].endPos),h.pop();}t._tokenizeString=c;class d{constructor(e,t){this.scopes=e,this.endPos=t;}}t.LocalStackElement=d;},974:(e,t)=>{function n(e,t){throw new Error("Near offset "+e.pos+": "+t+" ~~~"+e.source.substr(e.pos,50)+"~~~")}Object.defineProperty(t,"__esModule",{value:!0}),t.parseJSON=void 0,t.parseJSON=function(e,t,o){let a=new s(e),c=new r,l=0,u=null,h=[],p=[];function d(){h.push(l),p.push(u);}function f(){l=h.pop(),u=p.pop();}function m(e){n(a,e);}for(;i(a,c);){if(0===l){if(null!==u&&m("too many constructs in root"),3===c.type){u={},o&&(u.$vscodeTextmateLocation=c.toLocation(t)),d(),l=1;continue}if(2===c.type){u=[],d(),l=4;continue}m("unexpected token in root");}if(2===l){if(5===c.type){f();continue}if(7===c.type){l=3;continue}m("expected , or }");}if(1===l||3===l){if(1===l&&5===c.type){f();continue}if(1===c.type){let e=c.value;if(i(a,c)&&6===c.type||m("expected colon"),i(a,c)||m("expected value"),l=2,1===c.type){u[e]=c.value;continue}if(8===c.type){u[e]=null;continue}if(9===c.type){u[e]=!0;continue}if(10===c.type){u[e]=!1;continue}if(11===c.type){u[e]=parseFloat(c.value);continue}if(2===c.type){let t=[];u[e]=t,d(),l=4,u=t;continue}if(3===c.type){let n={};o&&(n.$vscodeTextmateLocation=c.toLocation(t)),u[e]=n,d(),l=1,u=n;continue}}m("unexpected token in dict");}if(5===l){if(4===c.type){f();continue}if(7===c.type){l=6;continue}m("expected , or ]");}if(4===l||6===l){if(4===l&&4===c.type){f();continue}if(l=5,1===c.type){u.push(c.value);continue}if(8===c.type){u.push(null);continue}if(9===c.type){u.push(!0);continue}if(10===c.type){u.push(!1);continue}if(11===c.type){u.push(parseFloat(c.value));continue}if(2===c.type){let e=[];u.push(e),d(),l=4,u=e;continue}if(3===c.type){let e={};o&&(e.$vscodeTextmateLocation=c.toLocation(t)),u.push(e),d(),l=1,u=e;continue}m("unexpected token in array");}m("unknown state");}return 0!==p.length&&m("unclosed constructs"),u};class s{constructor(e){this.source=e,this.pos=0,this.len=e.length,this.line=1,this.char=0;}}class r{constructor(){this.value=null,this.type=0,this.offset=-1,this.len=-1,this.line=-1,this.char=-1;}toLocation(e){return {filename:e,line:this.line,char:this.char}}}function i(e,t){t.value=null,t.type=0,t.offset=-1,t.len=-1,t.line=-1,t.char=-1;let s,r=e.source,i=e.pos,o=e.len,a=e.line,c=e.char;for(;;){if(i>=o)return !1;if(s=r.charCodeAt(i),32!==s&&9!==s&&13!==s){if(10!==s)break;i++,a++,c=0;}else i++,c++;}if(t.offset=i,t.line=a,t.char=c,34===s){for(t.type=1,i++,c++;;){if(i>=o)return !1;if(s=r.charCodeAt(i),i++,c++,92!==s){if(34===s)break}else i++,c++;}t.value=r.substring(t.offset+1,i-1).replace(/\\u([0-9A-Fa-f]{4})/g,((e,t)=>String.fromCodePoint(parseInt(t,16)))).replace(/\\(.)/g,((t,s)=>{switch(s){case'"':return '"';case"\\":return "\\";case"/":return "/";case"b":return "\b";case"f":return "\f";case"n":return "\n";case"r":return "\r";case"t":return "\t";default:n(e,"invalid escape sequence");}throw new Error("unreachable")}));}else if(91===s)t.type=2,i++,c++;else if(123===s)t.type=3,i++,c++;else if(93===s)t.type=4,i++,c++;else if(125===s)t.type=5,i++,c++;else if(58===s)t.type=6,i++,c++;else if(44===s)t.type=7,i++,c++;else if(110===s){if(t.type=8,i++,c++,s=r.charCodeAt(i),117!==s)return !1;if(i++,c++,s=r.charCodeAt(i),108!==s)return !1;if(i++,c++,s=r.charCodeAt(i),108!==s)return !1;i++,c++;}else if(116===s){if(t.type=9,i++,c++,s=r.charCodeAt(i),114!==s)return !1;if(i++,c++,s=r.charCodeAt(i),117!==s)return !1;if(i++,c++,s=r.charCodeAt(i),101!==s)return !1;i++,c++;}else if(102===s){if(t.type=10,i++,c++,s=r.charCodeAt(i),97!==s)return !1;if(i++,c++,s=r.charCodeAt(i),108!==s)return !1;if(i++,c++,s=r.charCodeAt(i),115!==s)return !1;if(i++,c++,s=r.charCodeAt(i),101!==s)return !1;i++,c++;}else for(t.type=11;;){if(i>=o)return !1;if(s=r.charCodeAt(i),!(46===s||s>=48&&s<=57||101===s||69===s||45===s||43===s))break;i++,c++;}return t.len=i-t.offset,null===t.value&&(t.value=r.substr(t.offset,t.len)),e.pos=i,e.line=a,e.char=c,!0}},787:function(e,t,n){var s=this&&this.__createBinding||(Object.create?function(e,t,n,s){void 0===s&&(s=n),Object.defineProperty(e,s,{enumerable:!0,get:function(){return t[n]}});}:function(e,t,n,s){void 0===s&&(s=n),e[s]=t[n];}),r=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||s(t,e,n);};Object.defineProperty(t,"__esModule",{value:!0}),t.applyStateStackDiff=t.diffStateStacksRefEq=t.parseRawGrammar=t.INITIAL=t.Registry=void 0;const i=n(391),o=n(50),a=n(652),c=n(583),l=n(965),u=n(442);Object.defineProperty(t,"applyStateStackDiff",{enumerable:!0,get:function(){return u.applyStateStackDiff}}),Object.defineProperty(t,"diffStateStacksRefEq",{enumerable:!0,get:function(){return u.diffStateStacksRefEq}}),r(n(44),t),t.Registry=class{constructor(e){this._options=e,this._syncRegistry=new a.SyncRegistry(c.Theme.createFromRawTheme(e.theme,e.colorMap),e.onigLib),this._ensureGrammarCache=new Map;}dispose(){this._syncRegistry.dispose();}setTheme(e,t){this._syncRegistry.setTheme(c.Theme.createFromRawTheme(e,t));}getColorMap(){return this._syncRegistry.getColorMap()}loadGrammarWithEmbeddedLanguages(e,t,n){return this.loadGrammarWithConfiguration(e,t,{embeddedLanguages:n})}loadGrammarWithConfiguration(e,t,n){return this._loadGrammar(e,t,n.embeddedLanguages,n.tokenTypes,new i.BalancedBracketSelectors(n.balancedBracketSelectors||[],n.unbalancedBracketSelectors||[]))}loadGrammar(e){return this._loadGrammar(e,0,null,null,null)}async _loadGrammar(e,t,n,s,r){const i=new l.ScopeDependencyProcessor(this._syncRegistry,e);for(;i.Q.length>0;)await Promise.all(i.Q.map((e=>this._loadSingleGrammar(e.scopeName)))),i.processQueue();return this._grammarForScopeName(e,t,n,s,r)}async _loadSingleGrammar(e){return this._ensureGrammarCache.has(e)||this._ensureGrammarCache.set(e,this._doLoadSingleGrammar(e)),this._ensureGrammarCache.get(e)}async _doLoadSingleGrammar(e){const t=await this._options.loadGrammar(e);if(t){const n="function"==typeof this._options.getInjections?this._options.getInjections(e):void 0;this._syncRegistry.addGrammar(t,n);}}async addGrammar(e,t=[],n=0,s=null){return this._syncRegistry.addGrammar(e,t),await this._grammarForScopeName(e.scopeName,n,s)}_grammarForScopeName(e,t=0,n=null,s=null,r=null){return this._syncRegistry.grammarForScopeName(e,t,n,s,r)}},t.INITIAL=i.StateStackImpl.NULL,t.parseRawGrammar=o.parseRawGrammar;},736:(e,t)=>{function n(e){return !!e&&!!e.match(/[\w\.:]+/)}Object.defineProperty(t,"__esModule",{value:!0}),t.createMatchers=void 0,t.createMatchers=function(e,t){const s=[],r=function(e){let t=/([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g,n=t.exec(e);return {next:()=>{if(!n)return null;const s=n[0];return n=t.exec(e),s}}}(e);let i=r.next();for(;null!==i;){let e=0;if(2===i.length&&":"===i.charAt(1)){switch(i.charAt(0)){case"R":e=1;break;case"L":e=-1;break;default:console.log(`Unknown priority ${i} in scope selector`);}i=r.next();}let t=a();if(s.push({matcher:t,priority:e}),","!==i)break;i=r.next();}return s;function o(){if("-"===i){i=r.next();const e=o();return t=>!!e&&!e(t)}if("("===i){i=r.next();const e=function(){const e=[];let t=a();for(;t&&(e.push(t),"|"===i||","===i);){do{i=r.next();}while("|"===i||","===i);t=a();}return t=>e.some((e=>e(t)))}();return ")"===i&&(i=r.next()),e}if(n(i)){const e=[];do{e.push(i),i=r.next();}while(n(i));return n=>t(e,n)}return null}function a(){const e=[];let t=o();for(;t;)e.push(t),t=o();return t=>e.every((e=>e(t)))}};},44:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.disposeOnigString=void 0,t.disposeOnigString=function(e){"function"==typeof e.dispose&&e.dispose();};},50:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.parseRawGrammar=void 0;const s=n(69),r=n(350),i=n(974);t.parseRawGrammar=function(e,t=null){return null!==t&&/\.json$/.test(t)?(n=e,o=t,r.DebugFlags.InDebugMode?i.parseJSON(n,o,!0):JSON.parse(n)):function(e,t){return r.DebugFlags.InDebugMode?s.parseWithLocation(e,t,"$vscodeTextmateLocation"):s.parsePLIST(e)}(e,t);var n,o;};},69:(e,t)=>{function n(e,t,n){const s=e.length;let r=0,i=1,o=0;function a(t){if(null===n)r+=t;else for(;t>0;)10===e.charCodeAt(r)?(r++,i++,o=0):(r++,o++),t--;}function c(e){null===n?r=e:a(e-r);}function l(){for(;r<s;){let t=e.charCodeAt(r);if(32!==t&&9!==t&&13!==t&&10!==t)break;a(1);}}function u(t){return e.substr(r,t.length)===t&&(a(t.length),!0)}function h(t){let n=e.indexOf(t,r);c(-1!==n?n+t.length:s);}function p(t){let n=e.indexOf(t,r);if(-1!==n){let s=e.substring(r,n);return c(n+t.length),s}{let t=e.substr(r);return c(s),t}}s>0&&65279===e.charCodeAt(0)&&(r=1);let d=0,f=null,m=[],g=[],_=null;function b(e,t){m.push(d),g.push(f),d=e,f=t;}function y(){if(0===m.length)return S("illegal state stack");d=m.pop(),f=g.pop();}function S(t){throw new Error("Near offset "+r+": "+t+" ~~~"+e.substr(r,50)+"~~~")}const k=function(){if(null===_)return S("missing <key>");let e={};null!==n&&(e[n]={filename:t,line:i,char:o}),f[_]=e,_=null,b(1,e);},C=function(){if(null===_)return S("missing <key>");let e=[];f[_]=e,_=null,b(2,e);},R=function(){let e={};null!==n&&(e[n]={filename:t,line:i,char:o}),f.push(e),b(1,e);},A=function(){let e=[];f.push(e),b(2,e);};function w(){if(1!==d)return S("unexpected </dict>");y();}function P(){return 1===d||2!==d?S("unexpected </array>"):void y()}function I(e){if(1===d){if(null===_)return S("missing <key>");f[_]=e,_=null;}else 2===d?f.push(e):f=e;}function v(e){if(isNaN(e))return S("cannot parse float");if(1===d){if(null===_)return S("missing <key>");f[_]=e,_=null;}else 2===d?f.push(e):f=e;}function N(e){if(isNaN(e))return S("cannot parse integer");if(1===d){if(null===_)return S("missing <key>");f[_]=e,_=null;}else 2===d?f.push(e):f=e;}function x(e){if(1===d){if(null===_)return S("missing <key>");f[_]=e,_=null;}else 2===d?f.push(e):f=e;}function T(e){if(1===d){if(null===_)return S("missing <key>");f[_]=e,_=null;}else 2===d?f.push(e):f=e;}function G(e){if(1===d){if(null===_)return S("missing <key>");f[_]=e,_=null;}else 2===d?f.push(e):f=e;}function E(){let e=p(">"),t=!1;return 47===e.charCodeAt(e.length-1)&&(t=!0,e=e.substring(0,e.length-1)),{name:e.trim(),isClosed:t}}function L(e){if(e.isClosed)return "";let t=p("</");return h(">"),t.replace(/&#([0-9]+);/g,(function(e,t){return String.fromCodePoint(parseInt(t,10))})).replace(/&#x([0-9a-f]+);/g,(function(e,t){return String.fromCodePoint(parseInt(t,16))})).replace(/&amp;|&lt;|&gt;|&quot;|&apos;/g,(function(e){switch(e){case"&amp;":return "&";case"&lt;":return "<";case"&gt;":return ">";case"&quot;":return '"';case"&apos;":return "'"}return e}))}for(;r<s&&(l(),!(r>=s));){const c=e.charCodeAt(r);if(a(1),60!==c)return S("expected <");if(r>=s)return S("unexpected end of input");const p=e.charCodeAt(r);if(63===p){a(1),h("?>");continue}if(33===p){if(a(1),u("--")){h("--\x3e");continue}h(">");continue}if(47===p){if(a(1),l(),u("plist")){h(">");continue}if(u("dict")){h(">"),w();continue}if(u("array")){h(">"),P();continue}return S("unexpected closed tag")}let m=E();switch(m.name){case"dict":1===d?k():2===d?R():(f={},null!==n&&(f[n]={filename:t,line:i,char:o}),b(1,f)),m.isClosed&&w();continue;case"array":1===d?C():2===d?A():(f=[],b(2,f)),m.isClosed&&P();continue;case"key":M=L(m),1!==d?S("unexpected <key>"):null!==_?S("too many <key>"):_=M;continue;case"string":I(L(m));continue;case"real":v(parseFloat(L(m)));continue;case"integer":N(parseInt(L(m),10));continue;case"date":x(new Date(L(m)));continue;case"data":T(L(m));continue;case"true":L(m),G(!0);continue;case"false":L(m),G(!1);continue}if(!/^plist/.test(m.name))return S("unexpected opened tag "+m.name)}var M;return f}Object.defineProperty(t,"__esModule",{value:!0}),t.parsePLIST=t.parseWithLocation=void 0,t.parseWithLocation=function(e,t,s){return n(e,t,s)},t.parsePLIST=function(e){return n(e,null,null)};},652:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.SyncRegistry=void 0;const s=n(391);t.SyncRegistry=class{constructor(e,t){this._onigLibPromise=t,this._grammars=new Map,this._rawGrammars=new Map,this._injectionGrammars=new Map,this._theme=e;}dispose(){for(const e of this._grammars.values())e.dispose();}setTheme(e){this._theme=e;}getColorMap(){return this._theme.getColorMap()}addGrammar(e,t){this._rawGrammars.set(e.scopeName,e),t&&this._injectionGrammars.set(e.scopeName,t);}lookup(e){return this._rawGrammars.get(e)}injections(e){return this._injectionGrammars.get(e)}getDefaults(){return this._theme.getDefaults()}themeMatch(e){return this._theme.match(e)}async grammarForScopeName(e,t,n,r,i){if(!this._grammars.has(e)){let o=this._rawGrammars.get(e);if(!o)return null;this._grammars.set(e,s.createGrammar(e,o,t,n,r,i,this,await this._onigLibPromise));}return this._grammars.get(e)}};},792:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.CompiledRule=t.RegExpSourceList=t.RegExpSource=t.RuleFactory=t.BeginWhileRule=t.BeginEndRule=t.IncludeOnlyRule=t.MatchRule=t.CaptureRule=t.Rule=t.ruleIdToNumber=t.ruleIdFromNumber=t.whileRuleId=t.endRuleId=void 0;const s=n(878),r=n(965),i=/\\(\d+)/,o=/\\(\d+)/g;t.endRuleId=-1,t.whileRuleId=-2,t.ruleIdFromNumber=function(e){return e},t.ruleIdToNumber=function(e){return e};class a{constructor(e,t,n,r){this.$location=e,this.id=t,this._name=n||null,this._nameIsCapturing=s.RegexSource.hasCaptures(this._name),this._contentName=r||null,this._contentNameIsCapturing=s.RegexSource.hasCaptures(this._contentName);}get debugName(){const e=this.$location?`${s.basename(this.$location.filename)}:${this.$location.line}`:"unknown";return `${this.constructor.name}#${this.id} @ ${e}`}getName(e,t){return this._nameIsCapturing&&null!==this._name&&null!==e&&null!==t?s.RegexSource.replaceCaptures(this._name,e,t):this._name}getContentName(e,t){return this._contentNameIsCapturing&&null!==this._contentName?s.RegexSource.replaceCaptures(this._contentName,e,t):this._contentName}}t.Rule=a;class c extends a{constructor(e,t,n,s,r){super(e,t,n,s),this.retokenizeCapturedWithRuleId=r;}dispose(){}collectPatterns(e,t){throw new Error("Not supported!")}compile(e,t){throw new Error("Not supported!")}compileAG(e,t,n,s){throw new Error("Not supported!")}}t.CaptureRule=c;class l extends a{constructor(e,t,n,s,r){super(e,t,n,null),this._match=new f(s,this.id),this.captures=r,this._cachedCompiledPatterns=null;}dispose(){this._cachedCompiledPatterns&&(this._cachedCompiledPatterns.dispose(),this._cachedCompiledPatterns=null);}get debugMatchRegExp(){return `${this._match.source}`}collectPatterns(e,t){t.push(this._match);}compile(e,t){return this._getCachedCompiledPatterns(e).compile(e)}compileAG(e,t,n,s){return this._getCachedCompiledPatterns(e).compileAG(e,n,s)}_getCachedCompiledPatterns(e){return this._cachedCompiledPatterns||(this._cachedCompiledPatterns=new m,this.collectPatterns(e,this._cachedCompiledPatterns)),this._cachedCompiledPatterns}}t.MatchRule=l;class u extends a{constructor(e,t,n,s,r){super(e,t,n,s),this.patterns=r.patterns,this.hasMissingPatterns=r.hasMissingPatterns,this._cachedCompiledPatterns=null;}dispose(){this._cachedCompiledPatterns&&(this._cachedCompiledPatterns.dispose(),this._cachedCompiledPatterns=null);}collectPatterns(e,t){for(const n of this.patterns)e.getRule(n).collectPatterns(e,t);}compile(e,t){return this._getCachedCompiledPatterns(e).compile(e)}compileAG(e,t,n,s){return this._getCachedCompiledPatterns(e).compileAG(e,n,s)}_getCachedCompiledPatterns(e){return this._cachedCompiledPatterns||(this._cachedCompiledPatterns=new m,this.collectPatterns(e,this._cachedCompiledPatterns)),this._cachedCompiledPatterns}}t.IncludeOnlyRule=u;class h extends a{constructor(e,t,n,s,r,i,o,a,c,l){super(e,t,n,s),this._begin=new f(r,this.id),this.beginCaptures=i,this._end=new f(o||"￿",-1),this.endHasBackReferences=this._end.hasBackReferences,this.endCaptures=a,this.applyEndPatternLast=c||!1,this.patterns=l.patterns,this.hasMissingPatterns=l.hasMissingPatterns,this._cachedCompiledPatterns=null;}dispose(){this._cachedCompiledPatterns&&(this._cachedCompiledPatterns.dispose(),this._cachedCompiledPatterns=null);}get debugBeginRegExp(){return `${this._begin.source}`}get debugEndRegExp(){return `${this._end.source}`}getEndWithResolvedBackReferences(e,t){return this._end.resolveBackReferences(e,t)}collectPatterns(e,t){t.push(this._begin);}compile(e,t){return this._getCachedCompiledPatterns(e,t).compile(e)}compileAG(e,t,n,s){return this._getCachedCompiledPatterns(e,t).compileAG(e,n,s)}_getCachedCompiledPatterns(e,t){if(!this._cachedCompiledPatterns){this._cachedCompiledPatterns=new m;for(const t of this.patterns)e.getRule(t).collectPatterns(e,this._cachedCompiledPatterns);this.applyEndPatternLast?this._cachedCompiledPatterns.push(this._end.hasBackReferences?this._end.clone():this._end):this._cachedCompiledPatterns.unshift(this._end.hasBackReferences?this._end.clone():this._end);}return this._end.hasBackReferences&&(this.applyEndPatternLast?this._cachedCompiledPatterns.setSource(this._cachedCompiledPatterns.length()-1,t):this._cachedCompiledPatterns.setSource(0,t)),this._cachedCompiledPatterns}}t.BeginEndRule=h;class p extends a{constructor(e,n,s,r,i,o,a,c,l){super(e,n,s,r),this._begin=new f(i,this.id),this.beginCaptures=o,this.whileCaptures=c,this._while=new f(a,t.whileRuleId),this.whileHasBackReferences=this._while.hasBackReferences,this.patterns=l.patterns,this.hasMissingPatterns=l.hasMissingPatterns,this._cachedCompiledPatterns=null,this._cachedCompiledWhilePatterns=null;}dispose(){this._cachedCompiledPatterns&&(this._cachedCompiledPatterns.dispose(),this._cachedCompiledPatterns=null),this._cachedCompiledWhilePatterns&&(this._cachedCompiledWhilePatterns.dispose(),this._cachedCompiledWhilePatterns=null);}get debugBeginRegExp(){return `${this._begin.source}`}get debugWhileRegExp(){return `${this._while.source}`}getWhileWithResolvedBackReferences(e,t){return this._while.resolveBackReferences(e,t)}collectPatterns(e,t){t.push(this._begin);}compile(e,t){return this._getCachedCompiledPatterns(e).compile(e)}compileAG(e,t,n,s){return this._getCachedCompiledPatterns(e).compileAG(e,n,s)}_getCachedCompiledPatterns(e){if(!this._cachedCompiledPatterns){this._cachedCompiledPatterns=new m;for(const t of this.patterns)e.getRule(t).collectPatterns(e,this._cachedCompiledPatterns);}return this._cachedCompiledPatterns}compileWhile(e,t){return this._getCachedCompiledWhilePatterns(e,t).compile(e)}compileWhileAG(e,t,n,s){return this._getCachedCompiledWhilePatterns(e,t).compileAG(e,n,s)}_getCachedCompiledWhilePatterns(e,t){return this._cachedCompiledWhilePatterns||(this._cachedCompiledWhilePatterns=new m,this._cachedCompiledWhilePatterns.push(this._while.hasBackReferences?this._while.clone():this._while)),this._while.hasBackReferences&&this._cachedCompiledWhilePatterns.setSource(0,t||"￿"),this._cachedCompiledWhilePatterns}}t.BeginWhileRule=p;class d{static createCaptureRule(e,t,n,s,r){return e.registerRule((e=>new c(t,e,n,s,r)))}static getCompiledRuleId(e,t,n){return e.id||t.registerRule((r=>{if(e.id=r,e.match)return new l(e.$vscodeTextmateLocation,e.id,e.name,e.match,d._compileCaptures(e.captures,t,n));if(void 0===e.begin){e.repository&&(n=s.mergeObjects({},n,e.repository));let r=e.patterns;return void 0===r&&e.include&&(r=[{include:e.include}]),new u(e.$vscodeTextmateLocation,e.id,e.name,e.contentName,d._compilePatterns(r,t,n))}return e.while?new p(e.$vscodeTextmateLocation,e.id,e.name,e.contentName,e.begin,d._compileCaptures(e.beginCaptures||e.captures,t,n),e.while,d._compileCaptures(e.whileCaptures||e.captures,t,n),d._compilePatterns(e.patterns,t,n)):new h(e.$vscodeTextmateLocation,e.id,e.name,e.contentName,e.begin,d._compileCaptures(e.beginCaptures||e.captures,t,n),e.end,d._compileCaptures(e.endCaptures||e.captures,t,n),e.applyEndPatternLast,d._compilePatterns(e.patterns,t,n))})),e.id}static _compileCaptures(e,t,n){let s=[];if(e){let r=0;for(const t in e){if("$vscodeTextmateLocation"===t)continue;const e=parseInt(t,10);e>r&&(r=e);}for(let e=0;e<=r;e++)s[e]=null;for(const r in e){if("$vscodeTextmateLocation"===r)continue;const i=parseInt(r,10);let o=0;e[r].patterns&&(o=d.getCompiledRuleId(e[r],t,n)),s[i]=d.createCaptureRule(t,e[r].$vscodeTextmateLocation,e[r].name,e[r].contentName,o);}}return s}static _compilePatterns(e,t,n){let s=[];if(e)for(let i=0,o=e.length;i<o;i++){const o=e[i];let a=-1;if(o.include){const e=r.parseInclude(o.include);switch(e.kind){case 0:case 1:a=d.getCompiledRuleId(n[o.include],t,n);break;case 2:let s=n[e.ruleName];s&&(a=d.getCompiledRuleId(s,t,n));break;case 3:case 4:const r=e.scopeName,i=4===e.kind?e.ruleName:null,c=t.getExternalGrammar(r,n);if(c)if(i){let e=c.repository[i];e&&(a=d.getCompiledRuleId(e,t,c.repository));}else a=d.getCompiledRuleId(c.repository.$self,t,c.repository);}}else a=d.getCompiledRuleId(o,t,n);if(-1!==a){const e=t.getRule(a);let n=!1;if((e instanceof u||e instanceof h||e instanceof p)&&e.hasMissingPatterns&&0===e.patterns.length&&(n=!0),n)continue;s.push(a);}}return {patterns:s,hasMissingPatterns:(e?e.length:0)!==s.length}}}t.RuleFactory=d;class f{constructor(e,t){if(e){const t=e.length;let n=0,s=[],r=!1;for(let i=0;i<t;i++)if("\\"===e.charAt(i)&&i+1<t){const t=e.charAt(i+1);"z"===t?(s.push(e.substring(n,i)),s.push("$(?!\\n)(?<!\\n)"),n=i+2):"A"!==t&&"G"!==t||(r=!0),i++;}this.hasAnchor=r,0===n?this.source=e:(s.push(e.substring(n,t)),this.source=s.join(""));}else this.hasAnchor=!1,this.source=e;this.hasAnchor?this._anchorCache=this._buildAnchorCache():this._anchorCache=null,this.ruleId=t,this.hasBackReferences=i.test(this.source);}clone(){return new f(this.source,this.ruleId)}setSource(e){this.source!==e&&(this.source=e,this.hasAnchor&&(this._anchorCache=this._buildAnchorCache()));}resolveBackReferences(e,t){let n=t.map((t=>e.substring(t.start,t.end)));return o.lastIndex=0,this.source.replace(o,((e,t)=>s.escapeRegExpCharacters(n[parseInt(t,10)]||"")))}_buildAnchorCache(){let e,t,n,s,r=[],i=[],o=[],a=[];for(e=0,t=this.source.length;e<t;e++)n=this.source.charAt(e),r[e]=n,i[e]=n,o[e]=n,a[e]=n,"\\"===n&&e+1<t&&(s=this.source.charAt(e+1),"A"===s?(r[e+1]="￿",i[e+1]="￿",o[e+1]="A",a[e+1]="A"):"G"===s?(r[e+1]="￿",i[e+1]="G",o[e+1]="￿",a[e+1]="G"):(r[e+1]=s,i[e+1]=s,o[e+1]=s,a[e+1]=s),e++);return {A0_G0:r.join(""),A0_G1:i.join(""),A1_G0:o.join(""),A1_G1:a.join("")}}resolveAnchors(e,t){return this.hasAnchor&&this._anchorCache?e?t?this._anchorCache.A1_G1:this._anchorCache.A1_G0:t?this._anchorCache.A0_G1:this._anchorCache.A0_G0:this.source}}t.RegExpSource=f;class m{constructor(){this._items=[],this._hasAnchors=!1,this._cached=null,this._anchorCache={A0_G0:null,A0_G1:null,A1_G0:null,A1_G1:null};}dispose(){this._disposeCaches();}_disposeCaches(){this._cached&&(this._cached.dispose(),this._cached=null),this._anchorCache.A0_G0&&(this._anchorCache.A0_G0.dispose(),this._anchorCache.A0_G0=null),this._anchorCache.A0_G1&&(this._anchorCache.A0_G1.dispose(),this._anchorCache.A0_G1=null),this._anchorCache.A1_G0&&(this._anchorCache.A1_G0.dispose(),this._anchorCache.A1_G0=null),this._anchorCache.A1_G1&&(this._anchorCache.A1_G1.dispose(),this._anchorCache.A1_G1=null);}push(e){this._items.push(e),this._hasAnchors=this._hasAnchors||e.hasAnchor;}unshift(e){this._items.unshift(e),this._hasAnchors=this._hasAnchors||e.hasAnchor;}length(){return this._items.length}setSource(e,t){this._items[e].source!==t&&(this._disposeCaches(),this._items[e].setSource(t));}compile(e){if(!this._cached){let t=this._items.map((e=>e.source));this._cached=new g(e,t,this._items.map((e=>e.ruleId)));}return this._cached}compileAG(e,t,n){return this._hasAnchors?t?n?(this._anchorCache.A1_G1||(this._anchorCache.A1_G1=this._resolveAnchors(e,t,n)),this._anchorCache.A1_G1):(this._anchorCache.A1_G0||(this._anchorCache.A1_G0=this._resolveAnchors(e,t,n)),this._anchorCache.A1_G0):n?(this._anchorCache.A0_G1||(this._anchorCache.A0_G1=this._resolveAnchors(e,t,n)),this._anchorCache.A0_G1):(this._anchorCache.A0_G0||(this._anchorCache.A0_G0=this._resolveAnchors(e,t,n)),this._anchorCache.A0_G0):this.compile(e)}_resolveAnchors(e,t,n){let s=this._items.map((e=>e.resolveAnchors(t,n)));return new g(e,s,this._items.map((e=>e.ruleId)))}}t.RegExpSourceList=m;class g{constructor(e,t,n){this.regExps=t,this.rules=n,this.scanner=e.createOnigScanner(t);}dispose(){"function"==typeof this.scanner.dispose&&this.scanner.dispose();}toString(){const e=[];for(let t=0,n=this.rules.length;t<n;t++)e.push("   - "+this.rules[t]+": "+this.regExps[t]);return e.join("\n")}findNextMatchSync(e,t,n){const s=this.scanner.findNextMatchSync(e,t,n);return s?{ruleId:this.rules[s.index],captureIndices:s.captureIndices}:null}}t.CompiledRule=g;},583:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ThemeTrieElement=t.ThemeTrieElementRule=t.ColorMap=t.fontStyleToString=t.ParsedThemeRule=t.parseTheme=t.StyleAttributes=t.ScopeStack=t.Theme=void 0;const s=n(878);class r{constructor(e,t,n){this._colorMap=e,this._defaults=t,this._root=n,this._cachedMatchRoot=new s.CachedFn((e=>this._root.match(e)));}static createFromRawTheme(e,t){return this.createFromParsedTheme(c(e),t)}static createFromParsedTheme(e,t){return function(e,t){e.sort(((e,t)=>{let n=s.strcmp(e.scope,t.scope);return 0!==n?n:(n=s.strArrCmp(e.parentScopes,t.parentScopes),0!==n?n:e.index-t.index)}));let n=0,i="#000000",o="#ffffff";for(;e.length>=1&&""===e[0].scope;){let t=e.shift();-1!==t.fontStyle&&(n=t.fontStyle),null!==t.foreground&&(i=t.foreground),null!==t.background&&(o=t.background);}let c=new u(t),l=new a(n,c.getId(i),c.getId(o)),d=new p(new h(0,null,-1,0,0),[]);for(let t=0,n=e.length;t<n;t++){let n=e[t];d.insert(0,n.scope,n.parentScopes,n.fontStyle,c.getId(n.foreground),c.getId(n.background));}return new r(c,l,d)}(e,t)}getColorMap(){return this._colorMap.getColorMap()}getDefaults(){return this._defaults}match(e){if(null===e)return this._defaults;const t=e.scopeName,n=this._cachedMatchRoot.get(t).find((t=>function(e,t){if(null===t)return !0;let n=0,s=t[n];for(;e;){if(o(e.scopeName,s)){if(n++,n===t.length)return !0;s=t[n];}e=e.parent;}return !1}(e.parent,t.parentScopes)));return n?new a(n.fontStyle,n.foreground,n.background):null}}t.Theme=r;class i{constructor(e,t){this.parent=e,this.scopeName=t;}static push(e,t){for(const n of t)e=new i(e,n);return e}static from(...e){let t=null;for(let n=0;n<e.length;n++)t=new i(t,e[n]);return t}push(e){return new i(this,e)}getSegments(){let e=this;const t=[];for(;e;)t.push(e.scopeName),e=e.parent;return t.reverse(),t}toString(){return this.getSegments().join(" ")}extends(e){return this===e||null!==this.parent&&this.parent.extends(e)}getExtensionIfDefined(e){const t=[];let n=this;for(;n&&n!==e;)t.push(n.scopeName),n=n.parent;return n===e?t.reverse():void 0}}function o(e,t){return t===e||e.startsWith(t)&&"."===e[t.length]}t.ScopeStack=i;class a{constructor(e,t,n){this.fontStyle=e,this.foregroundId=t,this.backgroundId=n;}}function c(e){if(!e)return [];if(!e.settings||!Array.isArray(e.settings))return [];let t=e.settings,n=[],r=0;for(let e=0,i=t.length;e<i;e++){let i,o=t[e];if(!o.settings)continue;if("string"==typeof o.scope){let e=o.scope;e=e.replace(/^[,]+/,""),e=e.replace(/[,]+$/,""),i=e.split(",");}else i=Array.isArray(o.scope)?o.scope:[""];let a=-1;if("string"==typeof o.settings.fontStyle){a=0;let e=o.settings.fontStyle.split(" ");for(let t=0,n=e.length;t<n;t++)switch(e[t]){case"italic":a|=1;break;case"bold":a|=2;break;case"underline":a|=4;break;case"strikethrough":a|=8;}}let c=null;"string"==typeof o.settings.foreground&&s.isValidHexColor(o.settings.foreground)&&(c=o.settings.foreground);let u=null;"string"==typeof o.settings.background&&s.isValidHexColor(o.settings.background)&&(u=o.settings.background);for(let t=0,s=i.length;t<s;t++){let s=i[t].trim().split(" "),o=s[s.length-1],h=null;s.length>1&&(h=s.slice(0,s.length-1),h.reverse()),n[r++]=new l(o,h,e,a,c,u);}}return n}t.StyleAttributes=a,t.parseTheme=c;class l{constructor(e,t,n,s,r,i){this.scope=e,this.parentScopes=t,this.index=n,this.fontStyle=s,this.foreground=r,this.background=i;}}t.ParsedThemeRule=l,t.fontStyleToString=function(e){if(-1===e)return "not set";let t="";return 1&e&&(t+="italic "),2&e&&(t+="bold "),4&e&&(t+="underline "),8&e&&(t+="strikethrough "),""===t&&(t="none"),t.trim()};class u{constructor(e){if(this._lastColorId=0,this._id2color=[],this._color2id=Object.create(null),Array.isArray(e)){this._isFrozen=!0;for(let t=0,n=e.length;t<n;t++)this._color2id[e[t]]=t,this._id2color[t]=e[t];}else this._isFrozen=!1;}getId(e){if(null===e)return 0;e=e.toUpperCase();let t=this._color2id[e];if(t)return t;if(this._isFrozen)throw new Error(`Missing color in color map - ${e}`);return t=++this._lastColorId,this._color2id[e]=t,this._id2color[t]=e,t}getColorMap(){return this._id2color.slice(0)}}t.ColorMap=u;class h{constructor(e,t,n,s,r){this.scopeDepth=e,this.parentScopes=t,this.fontStyle=n,this.foreground=s,this.background=r;}clone(){return new h(this.scopeDepth,this.parentScopes,this.fontStyle,this.foreground,this.background)}static cloneArr(e){let t=[];for(let n=0,s=e.length;n<s;n++)t[n]=e[n].clone();return t}acceptOverwrite(e,t,n,s){this.scopeDepth>e?console.log("how did this happen?"):this.scopeDepth=e,-1!==t&&(this.fontStyle=t),0!==n&&(this.foreground=n),0!==s&&(this.background=s);}}t.ThemeTrieElementRule=h;class p{constructor(e,t=[],n={}){this._mainRule=e,this._children=n,this._rulesWithParentScopes=t;}static _sortBySpecificity(e){return 1===e.length||e.sort(this._cmpBySpecificity),e}static _cmpBySpecificity(e,t){if(e.scopeDepth===t.scopeDepth){const n=e.parentScopes,s=t.parentScopes;let r=null===n?0:n.length,i=null===s?0:s.length;if(r===i)for(let e=0;e<r;e++){const t=n[e].length,r=s[e].length;if(t!==r)return r-t}return i-r}return t.scopeDepth-e.scopeDepth}match(e){if(""===e)return p._sortBySpecificity([].concat(this._mainRule).concat(this._rulesWithParentScopes));let t,n,s=e.indexOf(".");return -1===s?(t=e,n=""):(t=e.substring(0,s),n=e.substring(s+1)),this._children.hasOwnProperty(t)?this._children[t].match(n):p._sortBySpecificity([].concat(this._mainRule).concat(this._rulesWithParentScopes))}insert(e,t,n,s,r,i){if(""===t)return void this._doInsertHere(e,n,s,r,i);let o,a,c,l=t.indexOf(".");-1===l?(o=t,a=""):(o=t.substring(0,l),a=t.substring(l+1)),this._children.hasOwnProperty(o)?c=this._children[o]:(c=new p(this._mainRule.clone(),h.cloneArr(this._rulesWithParentScopes)),this._children[o]=c),c.insert(e+1,a,n,s,r,i);}_doInsertHere(e,t,n,r,i){if(null!==t){for(let o=0,a=this._rulesWithParentScopes.length;o<a;o++){let a=this._rulesWithParentScopes[o];if(0===s.strArrCmp(a.parentScopes,t))return void a.acceptOverwrite(e,n,r,i)}-1===n&&(n=this._mainRule.fontStyle),0===r&&(r=this._mainRule.foreground),0===i&&(i=this._mainRule.background),this._rulesWithParentScopes.push(new h(e,t,n,r,i));}else this._mainRule.acceptOverwrite(e,n,r,i);}}t.ThemeTrieElement=p;},878:(e,t)=>{function n(e){return Array.isArray(e)?function(e){let t=[];for(let s=0,r=e.length;s<r;s++)t[s]=n(e[s]);return t}(e):"object"==typeof e?function(e){let t={};for(let s in e)t[s]=n(e[s]);return t}(e):e}Object.defineProperty(t,"__esModule",{value:!0}),t.performanceNow=t.CachedFn=t.escapeRegExpCharacters=t.isValidHexColor=t.strArrCmp=t.strcmp=t.RegexSource=t.basename=t.mergeObjects=t.clone=void 0,t.clone=function(e){return n(e)},t.mergeObjects=function(e,...t){return t.forEach((t=>{for(let n in t)e[n]=t[n];})),e},t.basename=function e(t){const n=~t.lastIndexOf("/")||~t.lastIndexOf("\\");return 0===n?t:~n==t.length-1?e(t.substring(0,t.length-1)):t.substr(1+~n)};let s=/\$(\d+)|\${(\d+):\/(downcase|upcase)}/g;function r(e,t){return e<t?-1:e>t?1:0}t.RegexSource=class{static hasCaptures(e){return null!==e&&(s.lastIndex=0,s.test(e))}static replaceCaptures(e,t,n){return e.replace(s,((e,s,r,i)=>{let o=n[parseInt(s||r,10)];if(!o)return e;{let e=t.substring(o.start,o.end);for(;"."===e[0];)e=e.substring(1);switch(i){case"downcase":return e.toLowerCase();case"upcase":return e.toUpperCase();default:return e}}}))}},t.strcmp=r,t.strArrCmp=function(e,t){if(null===e&&null===t)return 0;if(!e)return -1;if(!t)return 1;let n=e.length,s=t.length;if(n===s){for(let s=0;s<n;s++){let n=r(e[s],t[s]);if(0!==n)return n}return 0}return n-s},t.isValidHexColor=function(e){return !!(/^#[0-9a-f]{6}$/i.test(e)||/^#[0-9a-f]{8}$/i.test(e)||/^#[0-9a-f]{3}$/i.test(e)||/^#[0-9a-f]{4}$/i.test(e))},t.escapeRegExpCharacters=function(e){return e.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g,"\\$&")},t.CachedFn=class{constructor(e){this.fn=e,this.cache=new Map;}get(e){if(this.cache.has(e))return this.cache.get(e);const t=this.fn(e);return this.cache.set(e,t),t}},t.performanceNow="undefined"==typeof performance?function(){return Date.now()}:function(){return performance.now()};}},t={};return function n(s){var r=t[s];if(void 0!==r)return r.exports;var i=t[s]={exports:{}};return e[s].call(i.exports,i,i.exports,n),i.exports}(787)})()}));
	
} (main));

var mainExports = main.exports;

function toShikiTheme(rawTheme) {
  const type = rawTheme.type || "dark";
  const shikiTheme = {
    name: rawTheme.name,
    type,
    ...rawTheme,
    ...getThemeDefaultColors(rawTheme)
  };
  if (rawTheme.include)
    shikiTheme.include = rawTheme.include;
  if (rawTheme.tokenColors) {
    shikiTheme.settings = rawTheme.tokenColors;
    delete shikiTheme.tokenColors;
  }
  repairTheme(shikiTheme);
  return shikiTheme;
}
function repairTheme(theme) {
  if (!theme.settings)
    theme.settings = [];
  if (theme.settings[0] && theme.settings[0].settings && !theme.settings[0].scope)
    return;
  theme.settings.unshift({
    settings: {
      foreground: theme.fg,
      background: theme.bg
    }
  });
}
const VSCODE_FALLBACK_EDITOR_FG = { light: "#333333", dark: "#bbbbbb" };
const VSCODE_FALLBACK_EDITOR_BG = { light: "#fffffe", dark: "#1e1e1e" };
function getThemeDefaultColors(theme) {
  let fg, bg;
  const settings = theme.settings ? theme.settings : theme.tokenColors;
  const globalSetting = settings ? settings.find((s) => {
    return !s.name && !s.scope;
  }) : void 0;
  if (globalSetting?.settings?.foreground)
    fg = globalSetting.settings.foreground;
  if (globalSetting?.settings?.background)
    bg = globalSetting.settings.background;
  if (!fg && theme?.colors?.["editor.foreground"])
    fg = theme.colors["editor.foreground"];
  if (!bg && theme?.colors?.["editor.background"])
    bg = theme.colors["editor.background"];
  if (!fg)
    fg = theme.type === "light" ? VSCODE_FALLBACK_EDITOR_FG.light : VSCODE_FALLBACK_EDITOR_FG.dark;
  if (!bg)
    bg = theme.type === "light" ? VSCODE_FALLBACK_EDITOR_BG.light : VSCODE_FALLBACK_EDITOR_BG.dark;
  return {
    fg,
    bg
  };
}

class Registry extends mainExports.Registry {
  constructor(_resolver, _themes, _langs) {
    super(_resolver);
    this._resolver = _resolver;
    this._themes = _themes;
    this._langs = _langs;
    this.themesPath = "themes/";
    this._resolvedThemes = {};
    this._resolvedGrammars = {};
    this._langMap = {};
    this._langGraph = /* @__PURE__ */ new Map();
    _themes.forEach((t) => this.loadTheme(t));
    _langs.forEach((l) => this.loadLanguage(l));
  }
  getTheme(theme) {
    if (typeof theme === "string")
      return this._resolvedThemes[theme];
    else
      return this.loadTheme(theme);
  }
  loadTheme(theme) {
    const _theme = toShikiTheme(theme);
    if (_theme.name)
      this._resolvedThemes[_theme.name] = _theme;
    return _theme;
  }
  getLoadedThemes() {
    return Object.keys(this._resolvedThemes);
  }
  getGrammar(name) {
    return this._resolvedGrammars[name];
  }
  async loadLanguage(lang) {
    if (this._resolvedGrammars[lang.name])
      return;
    this._resolver.addLanguage(lang);
    const embeddedLanguages = lang.embeddedLangs?.reduce(async (acc, l, idx) => {
      if (!this.getLoadedLanguages().includes(l) && this._resolver.getLangRegistration(l)) {
        await this._resolver.loadGrammar(this._resolver.getLangRegistration(l).scopeName);
        acc[this._resolver.getLangRegistration(l).scopeName] = idx + 2;
        return acc;
      }
    }, {});
    const grammarConfig = {
      embeddedLanguages,
      balancedBracketSelectors: lang.balancedBracketSelectors || ["*"],
      unbalancedBracketSelectors: lang.unbalancedBracketSelectors || []
    };
    const g = await this.loadGrammarWithConfiguration(lang.scopeName, 1, grammarConfig);
    this._resolvedGrammars[lang.name] = g;
    if (lang.aliases) {
      lang.aliases.forEach((la) => {
        this._resolvedGrammars[la] = g;
      });
    }
  }
  async init() {
    this._themes.map((t) => this.loadTheme(t));
    await this.loadLanguages(this._langs);
  }
  async loadLanguages(langs) {
    for (const lang of langs)
      this.resolveEmbeddedLanguages(lang);
    const langsGraphArray = Array.from(this._langGraph.entries());
    const missingLangs = langsGraphArray.filter(([_, lang]) => !lang);
    if (missingLangs.length) {
      const dependents = langsGraphArray.filter(([_, lang]) => lang && lang.embeddedLangs?.some((l) => missingLangs.map(([name]) => name).includes(l))).filter((lang) => !missingLangs.includes(lang));
      throw new Error(`[shikiji] Missing languages ${missingLangs.map(([name]) => `\`${name}\``).join(", ")}, required by ${dependents.map(([name]) => `\`${name}\``).join(", ")}`);
    }
    for (const [_, lang] of langsGraphArray)
      this._resolver.addLanguage(lang);
    for (const [_, lang] of langsGraphArray)
      await this.loadLanguage(lang);
  }
  getLoadedLanguages() {
    return Object.keys(this._resolvedGrammars);
  }
  resolveEmbeddedLanguages(lang) {
    this._langMap[lang.name] = lang;
    this._langGraph.set(lang.name, lang);
    if (lang.embeddedLangs) {
      for (const embeddedLang of lang.embeddedLangs)
        this._langGraph.set(embeddedLang, this._langMap[embeddedLang]);
    }
  }
}

class Resolver {
  constructor(onigLibPromise, onigLibName, langs) {
    this.languageMap = {};
    this.scopeToLangMap = {};
    this._onigLibPromise = onigLibPromise;
    this._onigLibName = onigLibName;
    langs.forEach((i) => this.addLanguage(i));
  }
  get onigLib() {
    return this._onigLibPromise;
  }
  getOnigLibName() {
    return this._onigLibName;
  }
  getLangRegistration(langIdOrAlias) {
    return this.languageMap[langIdOrAlias];
  }
  async loadGrammar(scopeName) {
    return this.scopeToLangMap[scopeName];
  }
  addLanguage(l) {
    this.languageMap[l.name] = l;
    if (l.aliases) {
      l.aliases.forEach((a) => {
        this.languageMap[a] = l;
      });
    }
    this.scopeToLangMap[l.scopeName] = l;
  }
}

async function getShikiContext(options = {}) {
  async function normalizeGetter(p) {
    return Promise.resolve(typeof p === "function" ? p() : p).then((r) => r.default || r);
  }
  async function resolveLangs(langs2) {
    return Array.from(new Set((await Promise.all(
      langs2.map(async (lang) => await normalizeGetter(lang).then((r) => Array.isArray(r) ? r : [r]))
    )).flat()));
  }
  const [
    themes,
    langs
  ] = await Promise.all([
    Promise.all((options.themes || []).map(normalizeGetter)),
    resolveLangs(options.langs || []),
    typeof options.loadWasm === "function" ? Promise.resolve(options.loadWasm()).then((r) => loadWasm(r)) : options.loadWasm ? loadWasm(options.loadWasm) : void 0
  ]);
  const resolver = new Resolver(Promise.resolve({
    createOnigScanner(patterns) {
      return createOnigScanner(patterns);
    },
    createOnigString(s) {
      return createOnigString(s);
    }
  }), "vscode-oniguruma", langs);
  const _registry = new Registry(resolver, themes, langs);
  await _registry.init();
  function getLangGrammar(name) {
    const _lang = _registry.getGrammar(name);
    if (!_lang)
      throw new Error(`[shikiji] Language \`${name}\` not found, you may need to load it first`);
    return _lang;
  }
  function getTheme(name) {
    const _theme = _registry.getTheme(name);
    if (!_theme)
      throw new Error(`[shikiji] Theme \`${name}\` not found, you may need to load it first`);
    return _theme;
  }
  function setTheme(name) {
    const theme = getTheme(name);
    _registry.setTheme(theme);
    const colorMap = _registry.getColorMap();
    return {
      theme,
      colorMap
    };
  }
  function getLoadedThemes() {
    return _registry.getLoadedThemes();
  }
  function getLoadedLanguages() {
    return _registry.getLoadedLanguages();
  }
  async function loadLanguage(...langs2) {
    await _registry.loadLanguages(await resolveLangs(langs2));
  }
  async function loadTheme(...themes2) {
    await Promise.all(
      themes2.map(async (theme) => _registry.loadTheme(await normalizeGetter(theme)))
    );
  }
  return {
    setTheme,
    getTheme,
    getLangGrammar,
    getLoadedThemes,
    getLoadedLanguages,
    loadLanguage,
    loadTheme
  };
}

/**
 * List of HTML void tag names.
 *
 * @type {Array<string>}
 */
const htmlVoidElements = [
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'command',
  'embed',
  'frame',
  'hr',
  'image',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
];

/**
 * @typedef {import('./info.js').Info} Info
 * @typedef {Record<string, Info>} Properties
 * @typedef {Record<string, string>} Normal
 */

class Schema {
  /**
   * @constructor
   * @param {Properties} property
   * @param {Normal} normal
   * @param {string} [space]
   */
  constructor(property, normal, space) {
    this.property = property;
    this.normal = normal;
    if (space) {
      this.space = space;
    }
  }
}

/** @type {Properties} */
Schema.prototype.property = {};
/** @type {Normal} */
Schema.prototype.normal = {};
/** @type {string|null} */
Schema.prototype.space = null;

/**
 * @typedef {import('./schema.js').Properties} Properties
 * @typedef {import('./schema.js').Normal} Normal
 */


/**
 * @param {Schema[]} definitions
 * @param {string} [space]
 * @returns {Schema}
 */
function merge(definitions, space) {
  /** @type {Properties} */
  const property = {};
  /** @type {Normal} */
  const normal = {};
  let index = -1;

  while (++index < definitions.length) {
    Object.assign(property, definitions[index].property);
    Object.assign(normal, definitions[index].normal);
  }

  return new Schema(property, normal, space)
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  return value.toLowerCase()
}

class Info {
  /**
   * @constructor
   * @param {string} property
   * @param {string} attribute
   */
  constructor(property, attribute) {
    /** @type {string} */
    this.property = property;
    /** @type {string} */
    this.attribute = attribute;
  }
}

/** @type {string|null} */
Info.prototype.space = null;
Info.prototype.boolean = false;
Info.prototype.booleanish = false;
Info.prototype.overloadedBoolean = false;
Info.prototype.number = false;
Info.prototype.commaSeparated = false;
Info.prototype.spaceSeparated = false;
Info.prototype.commaOrSpaceSeparated = false;
Info.prototype.mustUseProperty = false;
Info.prototype.defined = false;

let powers = 0;

const boolean = increment();
const booleanish = increment();
const overloadedBoolean = increment();
const number = increment();
const spaceSeparated = increment();
const commaSeparated = increment();
const commaOrSpaceSeparated = increment();

function increment() {
  return 2 ** ++powers
}

var types = /*#__PURE__*/Object.freeze({
  __proto__: null,
  boolean: boolean,
  booleanish: booleanish,
  commaOrSpaceSeparated: commaOrSpaceSeparated,
  commaSeparated: commaSeparated,
  number: number,
  overloadedBoolean: overloadedBoolean,
  spaceSeparated: spaceSeparated
});

/** @type {Array<keyof types>} */
// @ts-expect-error: hush.
const checks = Object.keys(types);

class DefinedInfo extends Info {
  /**
   * @constructor
   * @param {string} property
   * @param {string} attribute
   * @param {number|null} [mask]
   * @param {string} [space]
   */
  constructor(property, attribute, mask, space) {
    let index = -1;

    super(property, attribute);

    mark(this, 'space', space);

    if (typeof mask === 'number') {
      while (++index < checks.length) {
        const check = checks[index];
        mark(this, checks[index], (mask & types[check]) === types[check]);
      }
    }
  }
}

DefinedInfo.prototype.defined = true;

/**
 * @param {DefinedInfo} values
 * @param {string} key
 * @param {unknown} value
 */
function mark(values, key, value) {
  if (value) {
    // @ts-expect-error: assume `value` matches the expected value of `key`.
    values[key] = value;
  }
}

/**
 * @typedef {import('./schema.js').Properties} Properties
 * @typedef {import('./schema.js').Normal} Normal
 *
 * @typedef {Record<string, string>} Attributes
 *
 * @typedef {Object} Definition
 * @property {Record<string, number|null>} properties
 * @property {(attributes: Attributes, property: string) => string} transform
 * @property {string} [space]
 * @property {Attributes} [attributes]
 * @property {Array<string>} [mustUseProperty]
 */


const own$3 = {}.hasOwnProperty;

/**
 * @param {Definition} definition
 * @returns {Schema}
 */
function create(definition) {
  /** @type {Properties} */
  const property = {};
  /** @type {Normal} */
  const normal = {};
  /** @type {string} */
  let prop;

  for (prop in definition.properties) {
    if (own$3.call(definition.properties, prop)) {
      const value = definition.properties[prop];
      const info = new DefinedInfo(
        prop,
        definition.transform(definition.attributes || {}, prop),
        value,
        definition.space
      );

      if (
        definition.mustUseProperty &&
        definition.mustUseProperty.includes(prop)
      ) {
        info.mustUseProperty = true;
      }

      property[prop] = info;

      normal[normalize(prop)] = prop;
      normal[normalize(info.attribute)] = prop;
    }
  }

  return new Schema(property, normal, definition.space)
}

const xlink = create({
  space: 'xlink',
  transform(_, prop) {
    return 'xlink:' + prop.slice(5).toLowerCase()
  },
  properties: {
    xLinkActuate: null,
    xLinkArcRole: null,
    xLinkHref: null,
    xLinkRole: null,
    xLinkShow: null,
    xLinkTitle: null,
    xLinkType: null
  }
});

const xml = create({
  space: 'xml',
  transform(_, prop) {
    return 'xml:' + prop.slice(3).toLowerCase()
  },
  properties: {xmlLang: null, xmlBase: null, xmlSpace: null}
});

/**
 * @param {Record<string, string>} attributes
 * @param {string} attribute
 * @returns {string}
 */
function caseSensitiveTransform(attributes, attribute) {
  return attribute in attributes ? attributes[attribute] : attribute
}

/**
 * @param {Record<string, string>} attributes
 * @param {string} property
 * @returns {string}
 */
function caseInsensitiveTransform(attributes, property) {
  return caseSensitiveTransform(attributes, property.toLowerCase())
}

const xmlns = create({
  space: 'xmlns',
  attributes: {xmlnsxlink: 'xmlns:xlink'},
  transform: caseInsensitiveTransform,
  properties: {xmlns: null, xmlnsXLink: null}
});

const aria = create({
  transform(_, prop) {
    return prop === 'role' ? prop : 'aria-' + prop.slice(4).toLowerCase()
  },
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: booleanish,
    ariaAutoComplete: null,
    ariaBusy: booleanish,
    ariaChecked: booleanish,
    ariaColCount: number,
    ariaColIndex: number,
    ariaColSpan: number,
    ariaControls: spaceSeparated,
    ariaCurrent: null,
    ariaDescribedBy: spaceSeparated,
    ariaDetails: null,
    ariaDisabled: booleanish,
    ariaDropEffect: spaceSeparated,
    ariaErrorMessage: null,
    ariaExpanded: booleanish,
    ariaFlowTo: spaceSeparated,
    ariaGrabbed: booleanish,
    ariaHasPopup: null,
    ariaHidden: booleanish,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: spaceSeparated,
    ariaLevel: number,
    ariaLive: null,
    ariaModal: booleanish,
    ariaMultiLine: booleanish,
    ariaMultiSelectable: booleanish,
    ariaOrientation: null,
    ariaOwns: spaceSeparated,
    ariaPlaceholder: null,
    ariaPosInSet: number,
    ariaPressed: booleanish,
    ariaReadOnly: booleanish,
    ariaRelevant: null,
    ariaRequired: booleanish,
    ariaRoleDescription: spaceSeparated,
    ariaRowCount: number,
    ariaRowIndex: number,
    ariaRowSpan: number,
    ariaSelected: booleanish,
    ariaSetSize: number,
    ariaSort: null,
    ariaValueMax: number,
    ariaValueMin: number,
    ariaValueNow: number,
    ariaValueText: null,
    role: null
  }
});

const html$3 = create({
  space: 'html',
  attributes: {
    acceptcharset: 'accept-charset',
    classname: 'class',
    htmlfor: 'for',
    httpequiv: 'http-equiv'
  },
  transform: caseInsensitiveTransform,
  mustUseProperty: ['checked', 'multiple', 'muted', 'selected'],
  properties: {
    // Standard Properties.
    abbr: null,
    accept: commaSeparated,
    acceptCharset: spaceSeparated,
    accessKey: spaceSeparated,
    action: null,
    allow: null,
    allowFullScreen: boolean,
    allowPaymentRequest: boolean,
    allowUserMedia: boolean,
    alt: null,
    as: null,
    async: boolean,
    autoCapitalize: null,
    autoComplete: spaceSeparated,
    autoFocus: boolean,
    autoPlay: boolean,
    capture: boolean,
    charSet: null,
    checked: boolean,
    cite: null,
    className: spaceSeparated,
    cols: number,
    colSpan: null,
    content: null,
    contentEditable: booleanish,
    controls: boolean,
    controlsList: spaceSeparated,
    coords: number | commaSeparated,
    crossOrigin: null,
    data: null,
    dateTime: null,
    decoding: null,
    default: boolean,
    defer: boolean,
    dir: null,
    dirName: null,
    disabled: boolean,
    download: overloadedBoolean,
    draggable: booleanish,
    encType: null,
    enterKeyHint: null,
    form: null,
    formAction: null,
    formEncType: null,
    formMethod: null,
    formNoValidate: boolean,
    formTarget: null,
    headers: spaceSeparated,
    height: number,
    hidden: boolean,
    high: number,
    href: null,
    hrefLang: null,
    htmlFor: spaceSeparated,
    httpEquiv: spaceSeparated,
    id: null,
    imageSizes: null,
    imageSrcSet: null,
    inputMode: null,
    integrity: null,
    is: null,
    isMap: boolean,
    itemId: null,
    itemProp: spaceSeparated,
    itemRef: spaceSeparated,
    itemScope: boolean,
    itemType: spaceSeparated,
    kind: null,
    label: null,
    lang: null,
    language: null,
    list: null,
    loading: null,
    loop: boolean,
    low: number,
    manifest: null,
    max: null,
    maxLength: number,
    media: null,
    method: null,
    min: null,
    minLength: number,
    multiple: boolean,
    muted: boolean,
    name: null,
    nonce: null,
    noModule: boolean,
    noValidate: boolean,
    onAbort: null,
    onAfterPrint: null,
    onAuxClick: null,
    onBeforeMatch: null,
    onBeforePrint: null,
    onBeforeUnload: null,
    onBlur: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onContextLost: null,
    onContextMenu: null,
    onContextRestored: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFormData: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLanguageChange: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadEnd: null,
    onLoadStart: null,
    onMessage: null,
    onMessageError: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRejectionHandled: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onScrollEnd: null,
    onSecurityPolicyViolation: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onSlotChange: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnhandledRejection: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onWheel: null,
    open: boolean,
    optimum: number,
    pattern: null,
    ping: spaceSeparated,
    placeholder: null,
    playsInline: boolean,
    poster: null,
    preload: null,
    readOnly: boolean,
    referrerPolicy: null,
    rel: spaceSeparated,
    required: boolean,
    reversed: boolean,
    rows: number,
    rowSpan: number,
    sandbox: spaceSeparated,
    scope: null,
    scoped: boolean,
    seamless: boolean,
    selected: boolean,
    shape: null,
    size: number,
    sizes: null,
    slot: null,
    span: number,
    spellCheck: booleanish,
    src: null,
    srcDoc: null,
    srcLang: null,
    srcSet: null,
    start: number,
    step: null,
    style: null,
    tabIndex: number,
    target: null,
    title: null,
    translate: null,
    type: null,
    typeMustMatch: boolean,
    useMap: null,
    value: booleanish,
    width: number,
    wrap: null,

    // Legacy.
    // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
    align: null, // Several. Use CSS `text-align` instead,
    aLink: null, // `<body>`. Use CSS `a:active {color}` instead
    archive: spaceSeparated, // `<object>`. List of URIs to archives
    axis: null, // `<td>` and `<th>`. Use `scope` on `<th>`
    background: null, // `<body>`. Use CSS `background-image` instead
    bgColor: null, // `<body>` and table elements. Use CSS `background-color` instead
    border: number, // `<table>`. Use CSS `border-width` instead,
    borderColor: null, // `<table>`. Use CSS `border-color` instead,
    bottomMargin: number, // `<body>`
    cellPadding: null, // `<table>`
    cellSpacing: null, // `<table>`
    char: null, // Several table elements. When `align=char`, sets the character to align on
    charOff: null, // Several table elements. When `char`, offsets the alignment
    classId: null, // `<object>`
    clear: null, // `<br>`. Use CSS `clear` instead
    code: null, // `<object>`
    codeBase: null, // `<object>`
    codeType: null, // `<object>`
    color: null, // `<font>` and `<hr>`. Use CSS instead
    compact: boolean, // Lists. Use CSS to reduce space between items instead
    declare: boolean, // `<object>`
    event: null, // `<script>`
    face: null, // `<font>`. Use CSS instead
    frame: null, // `<table>`
    frameBorder: null, // `<iframe>`. Use CSS `border` instead
    hSpace: number, // `<img>` and `<object>`
    leftMargin: number, // `<body>`
    link: null, // `<body>`. Use CSS `a:link {color: *}` instead
    longDesc: null, // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
    lowSrc: null, // `<img>`. Use a `<picture>`
    marginHeight: number, // `<body>`
    marginWidth: number, // `<body>`
    noResize: boolean, // `<frame>`
    noHref: boolean, // `<area>`. Use no href instead of an explicit `nohref`
    noShade: boolean, // `<hr>`. Use background-color and height instead of borders
    noWrap: boolean, // `<td>` and `<th>`
    object: null, // `<applet>`
    profile: null, // `<head>`
    prompt: null, // `<isindex>`
    rev: null, // `<link>`
    rightMargin: number, // `<body>`
    rules: null, // `<table>`
    scheme: null, // `<meta>`
    scrolling: booleanish, // `<frame>`. Use overflow in the child context
    standby: null, // `<object>`
    summary: null, // `<table>`
    text: null, // `<body>`. Use CSS `color` instead
    topMargin: number, // `<body>`
    valueType: null, // `<param>`
    version: null, // `<html>`. Use a doctype.
    vAlign: null, // Several. Use CSS `vertical-align` instead
    vLink: null, // `<body>`. Use CSS `a:visited {color}` instead
    vSpace: number, // `<img>` and `<object>`

    // Non-standard Properties.
    allowTransparency: null,
    autoCorrect: null,
    autoSave: null,
    disablePictureInPicture: boolean,
    disableRemotePlayback: boolean,
    prefix: null,
    property: null,
    results: number,
    security: null,
    unselectable: null
  }
});

const svg$1 = create({
  space: 'svg',
  attributes: {
    accentHeight: 'accent-height',
    alignmentBaseline: 'alignment-baseline',
    arabicForm: 'arabic-form',
    baselineShift: 'baseline-shift',
    capHeight: 'cap-height',
    className: 'class',
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    crossOrigin: 'crossorigin',
    dataType: 'datatype',
    dominantBaseline: 'dominant-baseline',
    enableBackground: 'enable-background',
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    hrefLang: 'hreflang',
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    horizOriginY: 'horiz-origin-y',
    imageRendering: 'image-rendering',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    navDown: 'nav-down',
    navDownLeft: 'nav-down-left',
    navDownRight: 'nav-down-right',
    navLeft: 'nav-left',
    navNext: 'nav-next',
    navPrev: 'nav-prev',
    navRight: 'nav-right',
    navUp: 'nav-up',
    navUpLeft: 'nav-up-left',
    navUpRight: 'nav-up-right',
    onAbort: 'onabort',
    onActivate: 'onactivate',
    onAfterPrint: 'onafterprint',
    onBeforePrint: 'onbeforeprint',
    onBegin: 'onbegin',
    onCancel: 'oncancel',
    onCanPlay: 'oncanplay',
    onCanPlayThrough: 'oncanplaythrough',
    onChange: 'onchange',
    onClick: 'onclick',
    onClose: 'onclose',
    onCopy: 'oncopy',
    onCueChange: 'oncuechange',
    onCut: 'oncut',
    onDblClick: 'ondblclick',
    onDrag: 'ondrag',
    onDragEnd: 'ondragend',
    onDragEnter: 'ondragenter',
    onDragExit: 'ondragexit',
    onDragLeave: 'ondragleave',
    onDragOver: 'ondragover',
    onDragStart: 'ondragstart',
    onDrop: 'ondrop',
    onDurationChange: 'ondurationchange',
    onEmptied: 'onemptied',
    onEnd: 'onend',
    onEnded: 'onended',
    onError: 'onerror',
    onFocus: 'onfocus',
    onFocusIn: 'onfocusin',
    onFocusOut: 'onfocusout',
    onHashChange: 'onhashchange',
    onInput: 'oninput',
    onInvalid: 'oninvalid',
    onKeyDown: 'onkeydown',
    onKeyPress: 'onkeypress',
    onKeyUp: 'onkeyup',
    onLoad: 'onload',
    onLoadedData: 'onloadeddata',
    onLoadedMetadata: 'onloadedmetadata',
    onLoadStart: 'onloadstart',
    onMessage: 'onmessage',
    onMouseDown: 'onmousedown',
    onMouseEnter: 'onmouseenter',
    onMouseLeave: 'onmouseleave',
    onMouseMove: 'onmousemove',
    onMouseOut: 'onmouseout',
    onMouseOver: 'onmouseover',
    onMouseUp: 'onmouseup',
    onMouseWheel: 'onmousewheel',
    onOffline: 'onoffline',
    onOnline: 'ononline',
    onPageHide: 'onpagehide',
    onPageShow: 'onpageshow',
    onPaste: 'onpaste',
    onPause: 'onpause',
    onPlay: 'onplay',
    onPlaying: 'onplaying',
    onPopState: 'onpopstate',
    onProgress: 'onprogress',
    onRateChange: 'onratechange',
    onRepeat: 'onrepeat',
    onReset: 'onreset',
    onResize: 'onresize',
    onScroll: 'onscroll',
    onSeeked: 'onseeked',
    onSeeking: 'onseeking',
    onSelect: 'onselect',
    onShow: 'onshow',
    onStalled: 'onstalled',
    onStorage: 'onstorage',
    onSubmit: 'onsubmit',
    onSuspend: 'onsuspend',
    onTimeUpdate: 'ontimeupdate',
    onToggle: 'ontoggle',
    onUnload: 'onunload',
    onVolumeChange: 'onvolumechange',
    onWaiting: 'onwaiting',
    onZoom: 'onzoom',
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pointerEvents: 'pointer-events',
    referrerPolicy: 'referrerpolicy',
    renderingIntent: 'rendering-intent',
    shapeRendering: 'shape-rendering',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    strokeDashArray: 'stroke-dasharray',
    strokeDashOffset: 'stroke-dashoffset',
    strokeLineCap: 'stroke-linecap',
    strokeLineJoin: 'stroke-linejoin',
    strokeMiterLimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    tabIndex: 'tabindex',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    typeOf: 'typeof',
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    vectorEffect: 'vector-effect',
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    xHeight: 'x-height',
    // These were camelcased in Tiny. Now lowercased in SVG 2
    playbackOrder: 'playbackorder',
    timelineBegin: 'timelinebegin'
  },
  transform: caseSensitiveTransform,
  properties: {
    about: commaOrSpaceSeparated,
    accentHeight: number,
    accumulate: null,
    additive: null,
    alignmentBaseline: null,
    alphabetic: number,
    amplitude: number,
    arabicForm: null,
    ascent: number,
    attributeName: null,
    attributeType: null,
    azimuth: number,
    bandwidth: null,
    baselineShift: null,
    baseFrequency: null,
    baseProfile: null,
    bbox: null,
    begin: null,
    bias: number,
    by: null,
    calcMode: null,
    capHeight: number,
    className: spaceSeparated,
    clip: null,
    clipPath: null,
    clipPathUnits: null,
    clipRule: null,
    color: null,
    colorInterpolation: null,
    colorInterpolationFilters: null,
    colorProfile: null,
    colorRendering: null,
    content: null,
    contentScriptType: null,
    contentStyleType: null,
    crossOrigin: null,
    cursor: null,
    cx: null,
    cy: null,
    d: null,
    dataType: null,
    defaultAction: null,
    descent: number,
    diffuseConstant: number,
    direction: null,
    display: null,
    dur: null,
    divisor: number,
    dominantBaseline: null,
    download: boolean,
    dx: null,
    dy: null,
    edgeMode: null,
    editable: null,
    elevation: number,
    enableBackground: null,
    end: null,
    event: null,
    exponent: number,
    externalResourcesRequired: null,
    fill: null,
    fillOpacity: number,
    fillRule: null,
    filter: null,
    filterRes: null,
    filterUnits: null,
    floodColor: null,
    floodOpacity: null,
    focusable: null,
    focusHighlight: null,
    fontFamily: null,
    fontSize: null,
    fontSizeAdjust: null,
    fontStretch: null,
    fontStyle: null,
    fontVariant: null,
    fontWeight: null,
    format: null,
    fr: null,
    from: null,
    fx: null,
    fy: null,
    g1: commaSeparated,
    g2: commaSeparated,
    glyphName: commaSeparated,
    glyphOrientationHorizontal: null,
    glyphOrientationVertical: null,
    glyphRef: null,
    gradientTransform: null,
    gradientUnits: null,
    handler: null,
    hanging: number,
    hatchContentUnits: null,
    hatchUnits: null,
    height: null,
    href: null,
    hrefLang: null,
    horizAdvX: number,
    horizOriginX: number,
    horizOriginY: number,
    id: null,
    ideographic: number,
    imageRendering: null,
    initialVisibility: null,
    in: null,
    in2: null,
    intercept: number,
    k: number,
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    kernelMatrix: commaOrSpaceSeparated,
    kernelUnitLength: null,
    keyPoints: null, // SEMI_COLON_SEPARATED
    keySplines: null, // SEMI_COLON_SEPARATED
    keyTimes: null, // SEMI_COLON_SEPARATED
    kerning: null,
    lang: null,
    lengthAdjust: null,
    letterSpacing: null,
    lightingColor: null,
    limitingConeAngle: number,
    local: null,
    markerEnd: null,
    markerMid: null,
    markerStart: null,
    markerHeight: null,
    markerUnits: null,
    markerWidth: null,
    mask: null,
    maskContentUnits: null,
    maskUnits: null,
    mathematical: null,
    max: null,
    media: null,
    mediaCharacterEncoding: null,
    mediaContentEncodings: null,
    mediaSize: number,
    mediaTime: null,
    method: null,
    min: null,
    mode: null,
    name: null,
    navDown: null,
    navDownLeft: null,
    navDownRight: null,
    navLeft: null,
    navNext: null,
    navPrev: null,
    navRight: null,
    navUp: null,
    navUpLeft: null,
    navUpRight: null,
    numOctaves: null,
    observer: null,
    offset: null,
    onAbort: null,
    onActivate: null,
    onAfterPrint: null,
    onBeforePrint: null,
    onBegin: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnd: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFocusIn: null,
    onFocusOut: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadStart: null,
    onMessage: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onMouseWheel: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRepeat: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onShow: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onZoom: null,
    opacity: null,
    operator: null,
    order: null,
    orient: null,
    orientation: null,
    origin: null,
    overflow: null,
    overlay: null,
    overlinePosition: number,
    overlineThickness: number,
    paintOrder: null,
    panose1: null,
    path: null,
    pathLength: number,
    patternContentUnits: null,
    patternTransform: null,
    patternUnits: null,
    phase: null,
    ping: spaceSeparated,
    pitch: null,
    playbackOrder: null,
    pointerEvents: null,
    points: null,
    pointsAtX: number,
    pointsAtY: number,
    pointsAtZ: number,
    preserveAlpha: null,
    preserveAspectRatio: null,
    primitiveUnits: null,
    propagate: null,
    property: commaOrSpaceSeparated,
    r: null,
    radius: null,
    referrerPolicy: null,
    refX: null,
    refY: null,
    rel: commaOrSpaceSeparated,
    rev: commaOrSpaceSeparated,
    renderingIntent: null,
    repeatCount: null,
    repeatDur: null,
    requiredExtensions: commaOrSpaceSeparated,
    requiredFeatures: commaOrSpaceSeparated,
    requiredFonts: commaOrSpaceSeparated,
    requiredFormats: commaOrSpaceSeparated,
    resource: null,
    restart: null,
    result: null,
    rotate: null,
    rx: null,
    ry: null,
    scale: null,
    seed: null,
    shapeRendering: null,
    side: null,
    slope: null,
    snapshotTime: null,
    specularConstant: number,
    specularExponent: number,
    spreadMethod: null,
    spacing: null,
    startOffset: null,
    stdDeviation: null,
    stemh: null,
    stemv: null,
    stitchTiles: null,
    stopColor: null,
    stopOpacity: null,
    strikethroughPosition: number,
    strikethroughThickness: number,
    string: null,
    stroke: null,
    strokeDashArray: commaOrSpaceSeparated,
    strokeDashOffset: null,
    strokeLineCap: null,
    strokeLineJoin: null,
    strokeMiterLimit: number,
    strokeOpacity: number,
    strokeWidth: null,
    style: null,
    surfaceScale: number,
    syncBehavior: null,
    syncBehaviorDefault: null,
    syncMaster: null,
    syncTolerance: null,
    syncToleranceDefault: null,
    systemLanguage: commaOrSpaceSeparated,
    tabIndex: number,
    tableValues: null,
    target: null,
    targetX: number,
    targetY: number,
    textAnchor: null,
    textDecoration: null,
    textRendering: null,
    textLength: null,
    timelineBegin: null,
    title: null,
    transformBehavior: null,
    type: null,
    typeOf: commaOrSpaceSeparated,
    to: null,
    transform: null,
    u1: null,
    u2: null,
    underlinePosition: number,
    underlineThickness: number,
    unicode: null,
    unicodeBidi: null,
    unicodeRange: null,
    unitsPerEm: number,
    values: null,
    vAlphabetic: number,
    vMathematical: number,
    vectorEffect: null,
    vHanging: number,
    vIdeographic: number,
    version: null,
    vertAdvY: number,
    vertOriginX: number,
    vertOriginY: number,
    viewBox: null,
    viewTarget: null,
    visibility: null,
    width: null,
    widths: null,
    wordSpacing: null,
    writingMode: null,
    x: null,
    x1: null,
    x2: null,
    xChannelSelector: null,
    xHeight: number,
    y: null,
    y1: null,
    y2: null,
    yChannelSelector: null,
    z: null,
    zoomAndPan: null
  }
});

/**
 * @typedef {import('./util/schema.js').Schema} Schema
 */


const valid = /^data[-\w.:]+$/i;
const dash = /-[a-z]/g;
const cap = /[A-Z]/g;

/**
 * @param {Schema} schema
 * @param {string} value
 * @returns {Info}
 */
function find(schema, value) {
  const normal = normalize(value);
  let prop = value;
  let Type = Info;

  if (normal in schema.normal) {
    return schema.property[schema.normal[normal]]
  }

  if (normal.length > 4 && normal.slice(0, 4) === 'data' && valid.test(value)) {
    // Attribute or property.
    if (value.charAt(4) === '-') {
      // Turn it into a property.
      const rest = value.slice(5).replace(dash, camelcase);
      prop = 'data' + rest.charAt(0).toUpperCase() + rest.slice(1);
    } else {
      // Turn it into an attribute.
      const rest = value.slice(4);

      if (!dash.test(rest)) {
        let dashes = rest.replace(cap, kebab);

        if (dashes.charAt(0) !== '-') {
          dashes = '-' + dashes;
        }

        value = 'data' + dashes;
      }
    }

    Type = DefinedInfo;
  }

  return new Type(prop, value)
}

/**
 * @param {string} $0
 * @returns {string}
 */
function kebab($0) {
  return '-' + $0.toLowerCase()
}

/**
 * @param {string} $0
 * @returns {string}
 */
function camelcase($0) {
  return $0.charAt(1).toUpperCase()
}

/**
 * @typedef {import('./lib/util/info.js').Info} Info
 * @typedef {import('./lib/util/schema.js').Schema} Schema
 */

const html$2 = merge([xml, xlink, xmlns, aria, html$3], 'html');
const svg = merge([xml, xlink, xmlns, aria, svg$1], 'svg');

/**
 * @callback Handler
 *   Handle a value, with a certain ID field set to a certain value.
 *   The ID field is passed to `zwitch`, and it’s value is this function’s
 *   place on the `handlers` record.
 * @param {...any} parameters
 *   Arbitrary parameters passed to the zwitch.
 *   The first will be an object with a certain ID field set to a certain value.
 * @returns {any}
 *   Anything!
 */

/**
 * @callback UnknownHandler
 *   Handle values that do have a certain ID field, but it’s set to a value
 *   that is not listed in the `handlers` record.
 * @param {unknown} value
 *   An object with a certain ID field set to an unknown value.
 * @param {...any} rest
 *   Arbitrary parameters passed to the zwitch.
 * @returns {any}
 *   Anything!
 */

/**
 * @callback InvalidHandler
 *   Handle values that do not have a certain ID field.
 * @param {unknown} value
 *   Any unknown value.
 * @param {...any} rest
 *   Arbitrary parameters passed to the zwitch.
 * @returns {void|null|undefined|never}
 *   This should crash or return nothing.
 */

/**
 * @template {InvalidHandler} [Invalid=InvalidHandler]
 * @template {UnknownHandler} [Unknown=UnknownHandler]
 * @template {Record<string, Handler>} [Handlers=Record<string, Handler>]
 * @typedef Options
 *   Configuration (required).
 * @property {Invalid} [invalid]
 *   Handler to use for invalid values.
 * @property {Unknown} [unknown]
 *   Handler to use for unknown values.
 * @property {Handlers} [handlers]
 *   Handlers to use.
 */

const own$2 = {}.hasOwnProperty;

/**
 * Handle values based on a field.
 *
 * @template {InvalidHandler} [Invalid=InvalidHandler]
 * @template {UnknownHandler} [Unknown=UnknownHandler]
 * @template {Record<string, Handler>} [Handlers=Record<string, Handler>]
 * @param {string} key
 *   Field to switch on.
 * @param {Options<Invalid, Unknown, Handlers>} [options]
 *   Configuration (required).
 * @returns {{unknown: Unknown, invalid: Invalid, handlers: Handlers, (...parameters: Parameters<Handlers[keyof Handlers]>): ReturnType<Handlers[keyof Handlers]>, (...parameters: Parameters<Unknown>): ReturnType<Unknown>}}
 */
function zwitch(key, options) {
  const settings = options || {};

  /**
   * Handle one value.
   *
   * Based on the bound `key`, a respective handler will be called.
   * If `value` is not an object, or doesn’t have a `key` property, the special
   * “invalid” handler will be called.
   * If `value` has an unknown `key`, the special “unknown” handler will be
   * called.
   *
   * All arguments, and the context object, are passed through to the handler,
   * and it’s result is returned.
   *
   * @this {unknown}
   *   Any context object.
   * @param {unknown} [value]
   *   Any value.
   * @param {...unknown} parameters
   *   Arbitrary parameters passed to the zwitch.
   * @property {Handler} invalid
   *   Handle for values that do not have a certain ID field.
   * @property {Handler} unknown
   *   Handle values that do have a certain ID field, but it’s set to a value
   *   that is not listed in the `handlers` record.
   * @property {Handlers} handlers
   *   Record of handlers.
   * @returns {unknown}
   *   Anything.
   */
  function one(value, ...parameters) {
    /** @type {Handler|undefined} */
    let fn = one.invalid;
    const handlers = one.handlers;

    if (value && own$2.call(value, key)) {
      // @ts-expect-error Indexable.
      const id = String(value[key]);
      // @ts-expect-error Indexable.
      fn = own$2.call(handlers, id) ? handlers[id] : one.unknown;
    }

    if (fn) {
      return fn.call(this, value, ...parameters)
    }
  }

  one.handlers = settings.handlers || {};
  one.invalid = settings.invalid;
  one.unknown = settings.unknown;

  // @ts-expect-error: matches!
  return one
}

/**
 * @typedef CoreOptions
 * @property {Array<string>} [subset=[]]
 *   Whether to only escape the given subset of characters.
 * @property {boolean} [escapeOnly=false]
 *   Whether to only escape possibly dangerous characters.
 *   Those characters are `"`, `&`, `'`, `<`, `>`, and `` ` ``.
 *
 * @typedef FormatOptions
 * @property {(code: number, next: number, options: CoreWithFormatOptions) => string} format
 *   Format strategy.
 *
 * @typedef {CoreOptions & FormatOptions & import('./util/format-smart.js').FormatSmartOptions} CoreWithFormatOptions
 */

/**
 * Encode certain characters in `value`.
 *
 * @param {string} value
 * @param {CoreWithFormatOptions} options
 * @returns {string}
 */
function core(value, options) {
  value = value.replace(
    options.subset ? charactersToExpression(options.subset) : /["&'<>`]/g,
    basic
  );

  if (options.subset || options.escapeOnly) {
    return value
  }

  return (
    value
      // Surrogate pairs.
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, surrogate)
      // BMP control characters (C0 except for LF, CR, SP; DEL; and some more
      // non-ASCII ones).
      .replace(
        // eslint-disable-next-line no-control-regex, unicorn/no-hex-escape
        /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g,
        basic
      )
  )

  /**
   * @param {string} pair
   * @param {number} index
   * @param {string} all
   */
  function surrogate(pair, index, all) {
    return options.format(
      (pair.charCodeAt(0) - 0xd800) * 0x400 +
        pair.charCodeAt(1) -
        0xdc00 +
        0x10000,
      all.charCodeAt(index + 2),
      options
    )
  }

  /**
   * @param {string} character
   * @param {number} index
   * @param {string} all
   */
  function basic(character, index, all) {
    return options.format(
      character.charCodeAt(0),
      all.charCodeAt(index + 1),
      options
    )
  }
}

/**
 * @param {Array<string>} subset
 * @returns {RegExp}
 */
function charactersToExpression(subset) {
  /** @type {Array<string>} */
  const groups = [];
  let index = -1;

  while (++index < subset.length) {
    groups.push(subset[index].replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'));
  }

  return new RegExp('(?:' + groups.join('|') + ')', 'g')
}

/**
 * Configurable ways to encode characters as hexadecimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toHexadecimal(code, next, omit) {
  const value = '&#x' + code.toString(16).toUpperCase();
  return omit && next && !/[\dA-Fa-f]/.test(String.fromCharCode(next))
    ? value
    : value + ';'
}

/**
 * Configurable ways to encode characters as decimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toDecimal(code, next, omit) {
  const value = '&#' + String(code);
  return omit && next && !/\d/.test(String.fromCharCode(next))
    ? value
    : value + ';'
}

/**
 * List of legacy HTML named character references that don’t need a trailing semicolon.
 *
 * @type {Array<string>}
 */
const characterEntitiesLegacy = [
  'AElig',
  'AMP',
  'Aacute',
  'Acirc',
  'Agrave',
  'Aring',
  'Atilde',
  'Auml',
  'COPY',
  'Ccedil',
  'ETH',
  'Eacute',
  'Ecirc',
  'Egrave',
  'Euml',
  'GT',
  'Iacute',
  'Icirc',
  'Igrave',
  'Iuml',
  'LT',
  'Ntilde',
  'Oacute',
  'Ocirc',
  'Ograve',
  'Oslash',
  'Otilde',
  'Ouml',
  'QUOT',
  'REG',
  'THORN',
  'Uacute',
  'Ucirc',
  'Ugrave',
  'Uuml',
  'Yacute',
  'aacute',
  'acirc',
  'acute',
  'aelig',
  'agrave',
  'amp',
  'aring',
  'atilde',
  'auml',
  'brvbar',
  'ccedil',
  'cedil',
  'cent',
  'copy',
  'curren',
  'deg',
  'divide',
  'eacute',
  'ecirc',
  'egrave',
  'eth',
  'euml',
  'frac12',
  'frac14',
  'frac34',
  'gt',
  'iacute',
  'icirc',
  'iexcl',
  'igrave',
  'iquest',
  'iuml',
  'laquo',
  'lt',
  'macr',
  'micro',
  'middot',
  'nbsp',
  'not',
  'ntilde',
  'oacute',
  'ocirc',
  'ograve',
  'ordf',
  'ordm',
  'oslash',
  'otilde',
  'ouml',
  'para',
  'plusmn',
  'pound',
  'quot',
  'raquo',
  'reg',
  'sect',
  'shy',
  'sup1',
  'sup2',
  'sup3',
  'szlig',
  'thorn',
  'times',
  'uacute',
  'ucirc',
  'ugrave',
  'uml',
  'uuml',
  'yacute',
  'yen',
  'yuml'
];

/**
 * Map of named character references from HTML 4.
 *
 * @type {Record<string, string>}
 */
const characterEntitiesHtml4 = {
  nbsp: ' ',
  iexcl: '¡',
  cent: '¢',
  pound: '£',
  curren: '¤',
  yen: '¥',
  brvbar: '¦',
  sect: '§',
  uml: '¨',
  copy: '©',
  ordf: 'ª',
  laquo: '«',
  not: '¬',
  shy: '­',
  reg: '®',
  macr: '¯',
  deg: '°',
  plusmn: '±',
  sup2: '²',
  sup3: '³',
  acute: '´',
  micro: 'µ',
  para: '¶',
  middot: '·',
  cedil: '¸',
  sup1: '¹',
  ordm: 'º',
  raquo: '»',
  frac14: '¼',
  frac12: '½',
  frac34: '¾',
  iquest: '¿',
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Auml: 'Ä',
  Aring: 'Å',
  AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Euml: 'Ë',
  Igrave: 'Ì',
  Iacute: 'Í',
  Icirc: 'Î',
  Iuml: 'Ï',
  ETH: 'Ð',
  Ntilde: 'Ñ',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ouml: 'Ö',
  times: '×',
  Oslash: 'Ø',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Uuml: 'Ü',
  Yacute: 'Ý',
  THORN: 'Þ',
  szlig: 'ß',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  eth: 'ð',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  divide: '÷',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  thorn: 'þ',
  yuml: 'ÿ',
  fnof: 'ƒ',
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigmaf: 'ς',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  thetasym: 'ϑ',
  upsih: 'ϒ',
  piv: 'ϖ',
  bull: '•',
  hellip: '…',
  prime: '′',
  Prime: '″',
  oline: '‾',
  frasl: '⁄',
  weierp: '℘',
  image: 'ℑ',
  real: 'ℜ',
  trade: '™',
  alefsym: 'ℵ',
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',
  crarr: '↵',
  lArr: '⇐',
  uArr: '⇑',
  rArr: '⇒',
  dArr: '⇓',
  hArr: '⇔',
  forall: '∀',
  part: '∂',
  exist: '∃',
  empty: '∅',
  nabla: '∇',
  isin: '∈',
  notin: '∉',
  ni: '∋',
  prod: '∏',
  sum: '∑',
  minus: '−',
  lowast: '∗',
  radic: '√',
  prop: '∝',
  infin: '∞',
  ang: '∠',
  and: '∧',
  or: '∨',
  cap: '∩',
  cup: '∪',
  int: '∫',
  there4: '∴',
  sim: '∼',
  cong: '≅',
  asymp: '≈',
  ne: '≠',
  equiv: '≡',
  le: '≤',
  ge: '≥',
  sub: '⊂',
  sup: '⊃',
  nsub: '⊄',
  sube: '⊆',
  supe: '⊇',
  oplus: '⊕',
  otimes: '⊗',
  perp: '⊥',
  sdot: '⋅',
  lceil: '⌈',
  rceil: '⌉',
  lfloor: '⌊',
  rfloor: '⌋',
  lang: '〈',
  rang: '〉',
  loz: '◊',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  OElig: 'Œ',
  oelig: 'œ',
  Scaron: 'Š',
  scaron: 'š',
  Yuml: 'Ÿ',
  circ: 'ˆ',
  tilde: '˜',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  zwnj: '‌',
  zwj: '‍',
  lrm: '‎',
  rlm: '‏',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  dagger: '†',
  Dagger: '‡',
  permil: '‰',
  lsaquo: '‹',
  rsaquo: '›',
  euro: '€'
};

/**
 * List of legacy (that don’t need a trailing `;`) named references which could,
 * depending on what follows them, turn into a different meaning
 *
 * @type {Array<string>}
 */
const dangerous = [
  'cent',
  'copy',
  'divide',
  'gt',
  'lt',
  'not',
  'para',
  'times'
];

const own$1 = {}.hasOwnProperty;

/**
 * `characterEntitiesHtml4` but inverted.
 *
 * @type {Record<string, string>}
 */
const characters = {};

/** @type {string} */
let key;

for (key in characterEntitiesHtml4) {
  if (own$1.call(characterEntitiesHtml4, key)) {
    characters[characterEntitiesHtml4[key]] = key;
  }
}

/**
 * Configurable ways to encode characters as named references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @param {boolean|undefined} attribute
 * @returns {string}
 */
function toNamed(code, next, omit, attribute) {
  const character = String.fromCharCode(code);

  if (own$1.call(characters, character)) {
    const name = characters[character];
    const value = '&' + name;

    if (
      omit &&
      characterEntitiesLegacy.includes(name) &&
      !dangerous.includes(name) &&
      (!attribute ||
        (next &&
          next !== 61 /* `=` */ &&
          /[^\da-z]/i.test(String.fromCharCode(next))))
    ) {
      return value
    }

    return value + ';'
  }

  return ''
}

/**
 * @typedef FormatSmartOptions
 * @property {boolean} [useNamedReferences=false]
 *   Prefer named character references (`&amp;`) where possible.
 * @property {boolean} [useShortestReferences=false]
 *   Prefer the shortest possible reference, if that results in less bytes.
 *   **Note**: `useNamedReferences` can be omitted when using `useShortestReferences`.
 * @property {boolean} [omitOptionalSemicolons=false]
 *   Whether to omit semicolons when possible.
 *   **Note**: This creates what HTML calls “parse errors” but is otherwise still valid HTML — don’t use this except when building a minifier.
 *   Omitting semicolons is possible for certain named and numeric references in some cases.
 * @property {boolean} [attribute=false]
 *   Create character references which don’t fail in attributes.
 *   **Note**: `attribute` only applies when operating dangerously with
 *   `omitOptionalSemicolons: true`.
 */


/**
 * Configurable ways to encode a character yielding pretty or small results.
 *
 * @param {number} code
 * @param {number} next
 * @param {FormatSmartOptions} options
 * @returns {string}
 */
function formatSmart(code, next, options) {
  let numeric = toHexadecimal(code, next, options.omitOptionalSemicolons);
  /** @type {string|undefined} */
  let named;

  if (options.useNamedReferences || options.useShortestReferences) {
    named = toNamed(
      code,
      next,
      options.omitOptionalSemicolons,
      options.attribute
    );
  }

  // Use the shortest numeric reference when requested.
  // A simple algorithm would use decimal for all code points under 100, as
  // those are shorter than hexadecimal:
  //
  // * `&#99;` vs `&#x63;` (decimal shorter)
  // * `&#100;` vs `&#x64;` (equal)
  //
  // However, because we take `next` into consideration when `omit` is used,
  // And it would be possible that decimals are shorter on bigger values as
  // well if `next` is hexadecimal but not decimal, we instead compare both.
  if (
    (options.useShortestReferences || !named) &&
    options.useShortestReferences
  ) {
    const decimal = toDecimal(code, next, options.omitOptionalSemicolons);

    if (decimal.length < numeric.length) {
      numeric = decimal;
    }
  }

  return named &&
    (!options.useShortestReferences || named.length < numeric.length)
    ? named
    : numeric
}

/**
 * @typedef {import('./core.js').CoreOptions & import('./util/format-smart.js').FormatSmartOptions} Options
 * @typedef {import('./core.js').CoreOptions} LightOptions
 */


/**
 * Encode special characters in `value`.
 *
 * @param {string} value
 *   Value to encode.
 * @param {Options} [options]
 *   Configuration.
 * @returns {string}
 *   Encoded value.
 */
function stringifyEntities(value, options) {
  return core(value, Object.assign({format: formatSmart}, options))
}

/**
 * @typedef {import('hast').Comment} Comment
 * @typedef {import('hast').Parents} Parents
 *
 * @typedef {import('../index.js').State} State
 */


/**
 * Serialize a comment.
 *
 * @param {Comment} node
 *   Node to handle.
 * @param {number | undefined} _1
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _2
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function comment(node, _1, _2, state) {
  // See: <https://html.spec.whatwg.org/multipage/syntax.html#comments>
  return state.settings.bogusComments
    ? '<?' +
        stringifyEntities(
          node.value,
          Object.assign({}, state.settings.characterReferences, {subset: ['>']})
        ) +
        '>'
    : '<!--' + node.value.replace(/^>|^->|<!--|-->|--!>|<!-$/g, encode) + '-->'

  /**
   * @param {string} $0
   */
  function encode($0) {
    return stringifyEntities(
      $0,
      Object.assign({}, state.settings.characterReferences, {
        subset: ['<', '>']
      })
    )
  }
}

/**
 * @typedef {import('hast').Doctype} Doctype
 * @typedef {import('hast').Parents} Parents
 *
 * @typedef {import('../index.js').State} State
 */


/**
 * Serialize a doctype.
 *
 * @param {Doctype} _1
 *   Node to handle.
 * @param {number | undefined} _2
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _3
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function doctype(_1, _2, _3, state) {
  return (
    '<!' +
    (state.settings.upperDoctype ? 'DOCTYPE' : 'doctype') +
    (state.settings.tightDoctype ? '' : ' ') +
    'html>'
  )
}

/**
 * Count how often a character (or substring) is used in a string.
 *
 * @param {string} value
 *   Value to search in.
 * @param {string} character
 *   Character (or substring) to look for.
 * @return {number}
 *   Number of times `character` occurred in `value`.
 */
function ccount(value, character) {
  const source = String(value);

  if (typeof character !== 'string') {
    throw new TypeError('Expected character')
  }

  let count = 0;
  let index = source.indexOf(character);

  while (index !== -1) {
    count++;
    index = source.indexOf(character, index + character.length);
  }

  return count
}

/**
 * @typedef Options
 *   Configuration for `stringify`.
 * @property {boolean} [padLeft=true]
 *   Whether to pad a space before a token.
 * @property {boolean} [padRight=false]
 *   Whether to pad a space after a token.
 */


/**
 * Serialize an array of strings or numbers to comma-separated tokens.
 *
 * @param {Array<string|number>} values
 *   List of tokens.
 * @param {Options} [options]
 *   Configuration for `stringify` (optional).
 * @returns {string}
 *   Comma-separated tokens.
 */
function stringify$1(values, options) {
  const settings = options || {};

  // Ensure the last empty entry is seen.
  const input = values[values.length - 1] === '' ? [...values, ''] : values;

  return input
    .join(
      (settings.padRight ? ' ' : '') +
        ',' +
        (settings.padLeft === false ? '' : ' ')
    )
    .trim()
}

/**
 * Parse space-separated tokens to an array of strings.
 *
 * @param {string} value
 *   Space-separated tokens.
 * @returns {Array<string>}
 *   List of tokens.
 */

/**
 * Serialize an array of strings as space separated-tokens.
 *
 * @param {Array<string|number>} values
 *   List of tokens.
 * @returns {string}
 *   Space-separated tokens.
 */
function stringify(values) {
  return values.join(' ').trim()
}

/**
 * @typedef {import('hast').Nodes} Nodes
 */

// HTML whitespace expression.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const re = /[ \t\n\f\r]/g;

/**
 * Check if the given value is *inter-element whitespace*.
 *
 * @param {Nodes | string} thing
 *   Thing to check (`Node` or `string`).
 * @returns {boolean}
 *   Whether the `value` is inter-element whitespace (`boolean`): consisting of
 *   zero or more of space, tab (`\t`), line feed (`\n`), carriage return
 *   (`\r`), or form feed (`\f`); if a node is passed it must be a `Text` node,
 *   whose `value` field is checked.
 */
function whitespace(thing) {
  return typeof thing === 'object'
    ? thing.type === 'text'
      ? empty(thing.value)
      : false
    : empty(thing)
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function empty(value) {
  return value.replace(re, '') === ''
}

/**
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('hast').RootContent} RootContent
 */


const siblingAfter = siblings(1);
const siblingBefore = siblings(-1);

/** @type {Array<RootContent>} */
const emptyChildren$1 = [];

/**
 * Factory to check siblings in a direction.
 *
 * @param {number} increment
 */
function siblings(increment) {
  return sibling

  /**
   * Find applicable siblings in a direction.
   *
   * @template {Parents} Parent
   *   Parent type.
   * @param {Parent | undefined} parent
   *   Parent.
   * @param {number | undefined} index
   *   Index of child in `parent`.
   * @param {boolean | undefined} [includeWhitespace=false]
   *   Whether to include whitespace (default: `false`).
   * @returns {Parent extends {children: Array<infer Child>} ? Child | undefined : never}
   *   Child of parent.
   */
  function sibling(parent, index, includeWhitespace) {
    const siblings = parent ? parent.children : emptyChildren$1;
    let offset = (index || 0) + increment;
    let next = siblings[offset];

    if (!includeWhitespace) {
      while (next && whitespace(next)) {
        offset += increment;
        next = siblings[offset];
      }
    }

    // @ts-expect-error: it’s a correct child.
    return next
  }
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Parents} Parents
 */

/**
 * @callback OmitHandle
 *   Check if a tag can be omitted.
 * @param {Element} element
 *   Element to check.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether to omit a tag.
 *
 */

const own = {}.hasOwnProperty;

/**
 * Factory to check if a given node can have a tag omitted.
 *
 * @param {Record<string, OmitHandle>} handlers
 *   Omission handlers, where each key is a tag name, and each value is the
 *   corresponding handler.
 * @returns {OmitHandle}
 *   Whether to omit a tag of an element.
 */
function omission(handlers) {
  return omit

  /**
   * Check if a given node can have a tag omitted.
   *
   * @type {OmitHandle}
   */
  function omit(node, index, parent) {
    return (
      own.call(handlers, node.tagName) &&
      handlers[node.tagName](node, index, parent)
    )
  }
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Parents} Parents
 */


const closing = omission({
  body: body$1,
  caption: headOrColgroupOrCaption,
  colgroup: headOrColgroupOrCaption,
  dd,
  dt,
  head: headOrColgroupOrCaption,
  html: html$1,
  li,
  optgroup,
  option,
  p,
  rp: rubyElement,
  rt: rubyElement,
  tbody: tbody$1,
  td: cells,
  tfoot,
  th: cells,
  thead,
  tr
});

/**
 * Macro for `</head>`, `</colgroup>`, and `</caption>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function headOrColgroupOrCaption(_, index, parent) {
  const next = siblingAfter(parent, index, true);
  return (
    !next ||
    (next.type !== 'comment' &&
      !(next.type === 'text' && whitespace(next.value.charAt(0))))
  )
}

/**
 * Whether to omit `</html>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function html$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || next.type !== 'comment'
}

/**
 * Whether to omit `</body>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function body$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || next.type !== 'comment'
}

/**
 * Whether to omit `</p>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function p(_, index, parent) {
  const next = siblingAfter(parent, index);
  return next
    ? next.type === 'element' &&
        (next.tagName === 'address' ||
          next.tagName === 'article' ||
          next.tagName === 'aside' ||
          next.tagName === 'blockquote' ||
          next.tagName === 'details' ||
          next.tagName === 'div' ||
          next.tagName === 'dl' ||
          next.tagName === 'fieldset' ||
          next.tagName === 'figcaption' ||
          next.tagName === 'figure' ||
          next.tagName === 'footer' ||
          next.tagName === 'form' ||
          next.tagName === 'h1' ||
          next.tagName === 'h2' ||
          next.tagName === 'h3' ||
          next.tagName === 'h4' ||
          next.tagName === 'h5' ||
          next.tagName === 'h6' ||
          next.tagName === 'header' ||
          next.tagName === 'hgroup' ||
          next.tagName === 'hr' ||
          next.tagName === 'main' ||
          next.tagName === 'menu' ||
          next.tagName === 'nav' ||
          next.tagName === 'ol' ||
          next.tagName === 'p' ||
          next.tagName === 'pre' ||
          next.tagName === 'section' ||
          next.tagName === 'table' ||
          next.tagName === 'ul')
    : !parent ||
        // Confusing parent.
        !(
          parent.type === 'element' &&
          (parent.tagName === 'a' ||
            parent.tagName === 'audio' ||
            parent.tagName === 'del' ||
            parent.tagName === 'ins' ||
            parent.tagName === 'map' ||
            parent.tagName === 'noscript' ||
            parent.tagName === 'video')
        )
}

/**
 * Whether to omit `</li>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function li(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'li')
}

/**
 * Whether to omit `</dt>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function dt(_, index, parent) {
  const next = siblingAfter(parent, index);
  return Boolean(
    next &&
      next.type === 'element' &&
      (next.tagName === 'dt' || next.tagName === 'dd')
  )
}

/**
 * Whether to omit `</dd>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function dd(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'dt' || next.tagName === 'dd'))
  )
}

/**
 * Whether to omit `</rt>` or `</rp>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function rubyElement(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'rp' || next.tagName === 'rt'))
  )
}

/**
 * Whether to omit `</optgroup>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function optgroup(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'optgroup')
}

/**
 * Whether to omit `</option>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function option(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'option' || next.tagName === 'optgroup'))
  )
}

/**
 * Whether to omit `</thead>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function thead(_, index, parent) {
  const next = siblingAfter(parent, index);
  return Boolean(
    next &&
      next.type === 'element' &&
      (next.tagName === 'tbody' || next.tagName === 'tfoot')
  )
}

/**
 * Whether to omit `</tbody>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tbody$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'tbody' || next.tagName === 'tfoot'))
  )
}

/**
 * Whether to omit `</tfoot>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tfoot(_, index, parent) {
  return !siblingAfter(parent, index)
}

/**
 * Whether to omit `</tr>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tr(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'tr')
}

/**
 * Whether to omit `</td>` or `</th>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function cells(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'td' || next.tagName === 'th'))
  )
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Parents} Parents
 */


const opening = omission({
  body,
  colgroup,
  head,
  html,
  tbody
});

/**
 * Whether to omit `<html>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function html(node) {
  const head = siblingAfter(node, -1);
  return !head || head.type !== 'comment'
}

/**
 * Whether to omit `<head>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function head(node) {
  const children = node.children;
  /** @type {Array<string>} */
  const seen = [];
  let index = -1;

  while (++index < children.length) {
    const child = children[index];
    if (
      child.type === 'element' &&
      (child.tagName === 'title' || child.tagName === 'base')
    ) {
      if (seen.includes(child.tagName)) return false
      seen.push(child.tagName);
    }
  }

  return children.length > 0
}

/**
 * Whether to omit `<body>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function body(node) {
  const head = siblingAfter(node, -1, true);

  return (
    !head ||
    (head.type !== 'comment' &&
      !(head.type === 'text' && whitespace(head.value.charAt(0))) &&
      !(
        head.type === 'element' &&
        (head.tagName === 'meta' ||
          head.tagName === 'link' ||
          head.tagName === 'script' ||
          head.tagName === 'style' ||
          head.tagName === 'template')
      ))
  )
}

/**
 * Whether to omit `<colgroup>`.
 * The spec describes some logic for the opening tag, but it’s easier to
 * implement in the closing tag, to the same effect, so we handle it there
 * instead.
 *
 * @param {Element} node
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function colgroup(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1, true);

  // Previous colgroup was already omitted.
  if (
    parent &&
    previous &&
    previous.type === 'element' &&
    previous.tagName === 'colgroup' &&
    closing(previous, parent.children.indexOf(previous), parent)
  ) {
    return false
  }

  return Boolean(head && head.type === 'element' && head.tagName === 'col')
}

/**
 * Whether to omit `<tbody>`.
 *
 * @param {Element} node
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function tbody(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1);

  // Previous table section was already omitted.
  if (
    parent &&
    previous &&
    previous.type === 'element' &&
    (previous.tagName === 'thead' || previous.tagName === 'tbody') &&
    closing(previous, parent.children.indexOf(previous), parent)
  ) {
    return false
  }

  return Boolean(head && head.type === 'element' && head.tagName === 'tr')
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('hast').Properties} Properties
 *
 * @typedef {import('../index.js').State} State
 */


/**
 * Maps of subsets.
 *
 * Each value is a matrix of tuples.
 * The value at `0` causes parse errors, the value at `1` is valid.
 * Of both, the value at `0` is unsafe, and the value at `1` is safe.
 *
 * @type {Record<'double' | 'name' | 'single' | 'unquoted', Array<[Array<string>, Array<string>]>>}
 */
const constants = {
  // See: <https://html.spec.whatwg.org/#attribute-name-state>.
  name: [
    ['\t\n\f\r &/=>'.split(''), '\t\n\f\r "&\'/=>`'.split('')],
    ['\0\t\n\f\r "&\'/<=>'.split(''), '\0\t\n\f\r "&\'/<=>`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(unquoted)-state>.
  unquoted: [
    ['\t\n\f\r &>'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')],
    ['\0\t\n\f\r "&\'<=>`'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(single-quoted)-state>.
  single: [
    ["&'".split(''), '"&\'`'.split('')],
    ["\0&'".split(''), '\0"&\'`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(double-quoted)-state>.
  double: [
    ['"&'.split(''), '"&\'`'.split('')],
    ['\0"&'.split(''), '\0"&\'`'.split('')]
  ]
};

/**
 * Serialize an element node.
 *
 * @param {Element} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function element(node, index, parent, state) {
  const schema = state.schema;
  const omit = schema.space === 'svg' ? false : state.settings.omitOptionalTags;
  let selfClosing =
    schema.space === 'svg'
      ? state.settings.closeEmptyElements
      : state.settings.voids.includes(node.tagName.toLowerCase());
  /** @type {Array<string>} */
  const parts = [];
  /** @type {string} */
  let last;

  if (schema.space === 'html' && node.tagName === 'svg') {
    state.schema = svg;
  }

  const attrs = serializeAttributes(state, node.properties);

  const content = state.all(
    schema.space === 'html' && node.tagName === 'template' ? node.content : node
  );

  state.schema = schema;

  // If the node is categorised as void, but it has children, remove the
  // categorisation.
  // This enables for example `menuitem`s, which are void in W3C HTML but not
  // void in WHATWG HTML, to be stringified properly.
  // Note: `menuitem` has since been removed from the HTML spec, and so is no
  // longer void.
  if (content) selfClosing = false;

  if (attrs || !omit || !opening(node, index, parent)) {
    parts.push('<', node.tagName, attrs ? ' ' + attrs : '');

    if (
      selfClosing &&
      (schema.space === 'svg' || state.settings.closeSelfClosing)
    ) {
      last = attrs.charAt(attrs.length - 1);
      if (
        !state.settings.tightSelfClosing ||
        last === '/' ||
        (last && last !== '"' && last !== "'")
      ) {
        parts.push(' ');
      }

      parts.push('/');
    }

    parts.push('>');
  }

  parts.push(content);

  if (!selfClosing && (!omit || !closing(node, index, parent))) {
    parts.push('</' + node.tagName + '>');
  }

  return parts.join('')
}

/**
 * @param {State} state
 * @param {Properties | null | undefined} props
 * @returns {string}
 */
function serializeAttributes(state, props) {
  /** @type {Array<string>} */
  const values = [];
  let index = -1;
  /** @type {string} */
  let key;

  if (props) {
    for (key in props) {
      if (props[key] !== null && props[key] !== undefined) {
        const value = serializeAttribute(state, key, props[key]);
        if (value) values.push(value);
      }
    }
  }

  while (++index < values.length) {
    const last = state.settings.tightAttributes
      ? values[index].charAt(values[index].length - 1)
      : undefined;

    // In tight mode, don’t add a space after quoted attributes.
    if (index !== values.length - 1 && last !== '"' && last !== "'") {
      values[index] += ' ';
    }
  }

  return values.join('')
}

/**
 * @param {State} state
 * @param {string} key
 * @param {Properties[keyof Properties]} value
 * @returns {string}
 */
function serializeAttribute(state, key, value) {
  const info = find(state.schema, key);
  const x =
    state.settings.allowParseErrors && state.schema.space === 'html' ? 0 : 1;
  const y = state.settings.allowDangerousCharacters ? 0 : 1;
  let quote = state.quote;
  /** @type {string | undefined} */
  let result;

  if (info.overloadedBoolean && (value === info.attribute || value === '')) {
    value = true;
  } else if (
    info.boolean ||
    (info.overloadedBoolean && typeof value !== 'string')
  ) {
    value = Boolean(value);
  }

  if (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'number' && Number.isNaN(value))
  ) {
    return ''
  }

  const name = stringifyEntities(
    info.attribute,
    Object.assign({}, state.settings.characterReferences, {
      // Always encode without parse errors in non-HTML.
      subset: constants.name[x][y]
    })
  );

  // No value.
  // There is currently only one boolean property in SVG: `[download]` on
  // `<a>`.
  // This property does not seem to work in browsers (Firefox, Safari, Chrome),
  // so I can’t test if dropping the value works.
  // But I assume that it should:
  //
  // ```html
  // <!doctype html>
  // <svg viewBox="0 0 100 100">
  //   <a href=https://example.com download>
  //     <circle cx=50 cy=40 r=35 />
  //   </a>
  // </svg>
  // ```
  //
  // See: <https://github.com/wooorm/property-information/blob/main/lib/svg.js>
  if (value === true) return name

  // `spaces` doesn’t accept a second argument, but it’s given here just to
  // keep the code cleaner.
  value = Array.isArray(value)
    ? (info.commaSeparated ? stringify$1 : stringify)(value, {
        padLeft: !state.settings.tightCommaSeparatedLists
      })
    : String(value);

  if (state.settings.collapseEmptyAttributes && !value) return name

  // Check unquoted value.
  if (state.settings.preferUnquoted) {
    result = stringifyEntities(
      value,
      Object.assign({}, state.settings.characterReferences, {
        attribute: true,
        subset: constants.unquoted[x][y]
      })
    );
  }

  // If we don’t want unquoted, or if `value` contains character references when
  // unquoted…
  if (result !== value) {
    // If the alternative is less common than `quote`, switch.
    if (
      state.settings.quoteSmart &&
      ccount(value, quote) > ccount(value, state.alternative)
    ) {
      quote = state.alternative;
    }

    result =
      quote +
      stringifyEntities(
        value,
        Object.assign({}, state.settings.characterReferences, {
          // Always encode without parse errors in non-HTML.
          subset: (quote === "'" ? constants.single : constants.double)[x][y],
          attribute: true
        })
      ) +
      quote;
  }

  // Don’t add a `=` for unquoted empties.
  return name + (result ? '=' + result : result)
}

/**
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('hast').Text} Text
 *
 * @typedef {import('mdast-util-to-hast').Raw} Raw
 *
 * @typedef {import('../index.js').State} State
 */


/**
 * Serialize a text node.
 *
 * @param {Raw | Text} node
 *   Node to handle.
 * @param {number | undefined} _
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function text(node, _, parent, state) {
  // Check if content of `node` should be escaped.
  return parent &&
    parent.type === 'element' &&
    (parent.tagName === 'script' || parent.tagName === 'style')
    ? node.value
    : stringifyEntities(
        node.value,
        Object.assign({}, state.settings.characterReferences, {
          subset: ['<', '&']
        })
      )
}

/**
 * @typedef {import('hast').Parents} Parents
 *
 * @typedef {import('mdast-util-to-hast').Raw} Raw
 *
 * @typedef {import('../index.js').State} State
 */


/**
 * Serialize a raw node.
 *
 * @param {Raw} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function raw(node, index, parent, state) {
  return state.settings.allowDangerousHtml
    ? node.value
    : text(node, index, parent, state)
}

/**
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('hast').Root} Root
 *
 * @typedef {import('../index.js').State} State
 */


/**
 * Serialize a root.
 *
 * @param {Root} node
 *   Node to handle.
 * @param {number | undefined} _1
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _2
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function root(node, _1, _2, state) {
  return state.all(node)
}

/**
 * @typedef {import('hast').Nodes} Nodes
 * @typedef {import('hast').Parents} Parents
 *
 * @typedef {import('../index.js').State} State
 */


/**
 * @type {(node: Nodes, index: number | undefined, parent: Parents | undefined, state: State) => string}
 */
const handle = zwitch('type', {
  invalid,
  unknown,
  handlers: {comment, doctype, element, raw, root, text}
});

/**
 * Fail when a non-node is found in the tree.
 *
 * @param {unknown} node
 *   Unknown value.
 * @returns {never}
 *   Never.
 */
function invalid(node) {
  throw new Error('Expected node, not `' + node + '`')
}

/**
 * Fail when a node with an unknown type is found in the tree.
 *
 * @param {unknown} node_
 *  Unknown node.
 * @returns {never}
 *   Never.
 */
function unknown(node_) {
  // `type` is guaranteed by runtime JS.
  const node = /** @type {Nodes} */ (node_);
  throw new Error('Cannot compile unknown node `' + node.type + '`')
}

/**
 * @typedef {import('hast').Nodes} Nodes
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('hast').RootContent} RootContent
 *
 * @typedef {import('property-information').Schema} Schema
 *
 * @typedef {import('stringify-entities').Options} StringifyEntitiesOptions
 */


/** @type {Options} */
const emptyOptions = {};

/** @type {CharacterReferences} */
const emptyCharacterReferences = {};

/** @type {Array<never>} */
const emptyChildren = [];

/**
 * Serialize hast as HTML.
 *
 * @param {Array<RootContent> | Nodes} tree
 *   Tree to serialize.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {string}
 *   Serialized HTML.
 */
function toHtml(tree, options) {
  const options_ = options || emptyOptions;
  const quote = options_.quote || '"';
  const alternative = quote === '"' ? "'" : '"';

  if (quote !== '"' && quote !== "'") {
    throw new Error('Invalid quote `' + quote + '`, expected `\'` or `"`')
  }

  /** @type {State} */
  const state = {
    one,
    all,
    settings: {
      omitOptionalTags: options_.omitOptionalTags || false,
      allowParseErrors: options_.allowParseErrors || false,
      allowDangerousCharacters: options_.allowDangerousCharacters || false,
      quoteSmart: options_.quoteSmart || false,
      preferUnquoted: options_.preferUnquoted || false,
      tightAttributes: options_.tightAttributes || false,
      upperDoctype: options_.upperDoctype || false,
      tightDoctype: options_.tightDoctype || false,
      bogusComments: options_.bogusComments || false,
      tightCommaSeparatedLists: options_.tightCommaSeparatedLists || false,
      tightSelfClosing: options_.tightSelfClosing || false,
      collapseEmptyAttributes: options_.collapseEmptyAttributes || false,
      allowDangerousHtml: options_.allowDangerousHtml || false,
      voids: options_.voids || htmlVoidElements,
      characterReferences:
        options_.characterReferences || emptyCharacterReferences,
      closeSelfClosing: options_.closeSelfClosing || false,
      closeEmptyElements: options_.closeEmptyElements || false
    },
    schema: options_.space === 'svg' ? svg : html$2,
    quote,
    alternative
  };

  return state.one(
    Array.isArray(tree) ? {type: 'root', children: tree} : tree,
    undefined,
    undefined
  )
}

/**
 * Serialize a node.
 *
 * @this {State}
 *   Info passed around about the current state.
 * @param {Nodes} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {string}
 *   Serialized node.
 */
function one(node, index, parent) {
  return handle(node, index, parent, this)
}

/**
 * Serialize all children of `parent`.
 *
 * @this {State}
 *   Info passed around about the current state.
 * @param {Parents | undefined} parent
 *   Parent whose children to serialize.
 * @returns {string}
 */
function all(parent) {
  /** @type {Array<string>} */
  const results = [];
  const children = (parent && parent.children) || emptyChildren;
  let index = -1;

  while (++index < children.length) {
    results[index] = this.one(children[index], index, parent);
  }

  return results.join('')
}

var FontStyle = /* @__PURE__ */ ((FontStyle2) => {
  FontStyle2[FontStyle2["NotSet"] = -1] = "NotSet";
  FontStyle2[FontStyle2["None"] = 0] = "None";
  FontStyle2[FontStyle2["Italic"] = 1] = "Italic";
  FontStyle2[FontStyle2["Bold"] = 2] = "Bold";
  FontStyle2[FontStyle2["Underline"] = 4] = "Underline";
  return FontStyle2;
})(FontStyle || {});
class StackElementMetadata {
  static toBinaryStr(metadata) {
    let r = metadata.toString(2);
    while (r.length < 32)
      r = `0${r}`;
    return r;
  }
  // public static printMetadata(metadata: number): void {
  //   const languageId = StackElementMetadata.getLanguageId(metadata)
  //   const tokenType = StackElementMetadata.getTokenType(metadata)
  //   const fontStyle = StackElementMetadata.getFontStyle(metadata)
  //   const foreground = StackElementMetadata.getForeground(metadata)
  //   const background = StackElementMetadata.getBackground(metadata)
  //   console.log({
  //     languageId,
  //     tokenType,
  //     fontStyle,
  //     foreground,
  //     background,
  //   })
  // }
  static getLanguageId(metadata) {
    return (metadata & 255 /* LANGUAGEID_MASK */) >>> 0 /* LANGUAGEID_OFFSET */;
  }
  static getTokenType(metadata) {
    return (metadata & 768 /* TOKEN_TYPE_MASK */) >>> 8 /* TOKEN_TYPE_OFFSET */;
  }
  static getFontStyle(metadata) {
    return (metadata & 14336 /* FONT_STYLE_MASK */) >>> 11 /* FONT_STYLE_OFFSET */;
  }
  static getForeground(metadata) {
    return (metadata & 8372224 /* FOREGROUND_MASK */) >>> 15 /* FOREGROUND_OFFSET */;
  }
  static getBackground(metadata) {
    return (metadata & 4286578688 /* BACKGROUND_MASK */) >>> 24 /* BACKGROUND_OFFSET */;
  }
  static containsBalancedBrackets(metadata) {
    return (metadata & 1024 /* BALANCED_BRACKETS_MASK */) !== 0;
  }
  static set(metadata, languageId, tokenType, fontStyle, foreground, background) {
    let _languageId = StackElementMetadata.getLanguageId(metadata);
    let _tokenType = StackElementMetadata.getTokenType(metadata);
    let _fontStyle = StackElementMetadata.getFontStyle(metadata);
    let _foreground = StackElementMetadata.getForeground(metadata);
    let _background = StackElementMetadata.getBackground(metadata);
    const _containsBalancedBracketsBit = StackElementMetadata.containsBalancedBrackets(
      metadata
    ) ? 1 : 0;
    if (languageId !== 0)
      _languageId = languageId;
    if (tokenType !== 0 /* Other */) {
      _tokenType = tokenType === 8 /* MetaEmbedded */ ? 0 /* Other */ : tokenType;
    }
    if (fontStyle !== -1 /* NotSet */)
      _fontStyle = fontStyle;
    if (foreground !== 0)
      _foreground = foreground;
    if (background !== 0)
      _background = background;
    return (_languageId << 0 /* LANGUAGEID_OFFSET */ | _tokenType << 8 /* TOKEN_TYPE_OFFSET */ | _fontStyle << 11 /* FONT_STYLE_OFFSET */ | _containsBalancedBracketsBit << 10 /* BALANCED_BRACKETS_OFFSET */ | _foreground << 15 /* FOREGROUND_OFFSET */ | _background << 24 /* BACKGROUND_OFFSET */) >>> 0;
  }
}

function isPlaintext(lang) {
  return !lang || ["plaintext", "txt", "text", "plain"].includes(lang);
}
function toArray(x) {
  return Array.isArray(x) ? x : [x];
}
function isSpecialLang(lang) {
  return lang === "ansi" || isPlaintext(lang);
}

// src/colors.ts
var namedColors = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite"
];

// src/decorations.ts
var decorations = {
  1: "bold",
  2: "dim",
  3: "italic",
  4: "underline",
  7: "reverse",
  9: "strikethrough"
};

// src/parser.ts
function findSequence(value, position) {
  const nextEscape = value.indexOf("\x1B[", position);
  if (nextEscape !== -1) {
    const nextClose = value.indexOf("m", nextEscape);
    return {
      sequence: value.substring(nextEscape + 2, nextClose).split(";"),
      startPosition: nextEscape,
      position: nextClose + 1
    };
  }
  return {
    position: value.length
  };
}
function parseColor(sequence, index) {
  let offset = 1;
  const colorMode = sequence[index + offset++];
  let color;
  if (colorMode === "2") {
    const rgb = [
      sequence[index + offset++],
      sequence[index + offset++],
      sequence[index + offset]
    ].map((x) => Number.parseInt(x));
    if (rgb.length === 3 && !rgb.some((x) => Number.isNaN(x))) {
      color = {
        type: "rgb",
        rgb
      };
    }
  } else if (colorMode === "5") {
    const colorIndex = Number.parseInt(sequence[index + offset]);
    if (!Number.isNaN(colorIndex)) {
      color = { type: "table", index: Number(colorIndex) };
    }
  }
  return [offset, color];
}
function parseSequence(sequence) {
  const commands = [];
  for (let i = 0; i < sequence.length; i++) {
    const code = sequence[i];
    const codeInt = Number.parseInt(code);
    if (Number.isNaN(codeInt))
      continue;
    if (codeInt === 0) {
      commands.push({ type: "resetAll" });
    } else if (codeInt <= 9) {
      const decoration = decorations[codeInt];
      if (decoration) {
        commands.push({
          type: "setDecoration",
          value: decorations[codeInt]
        });
      }
    } else if (codeInt <= 29) {
      const decoration = decorations[codeInt - 20];
      if (decoration) {
        commands.push({
          type: "resetDecoration",
          value: decoration
        });
      }
    } else if (codeInt <= 37) {
      commands.push({
        type: "setForegroundColor",
        value: { type: "named", name: namedColors[codeInt - 30] }
      });
    } else if (codeInt === 38) {
      const [offset, color] = parseColor(sequence, i);
      if (color) {
        commands.push({
          type: "setForegroundColor",
          value: color
        });
      }
      i += offset;
    } else if (codeInt === 39) {
      commands.push({
        type: "resetForegroundColor"
      });
    } else if (codeInt <= 47) {
      commands.push({
        type: "setBackgroundColor",
        value: { type: "named", name: namedColors[codeInt - 40] }
      });
    } else if (codeInt === 48) {
      const [offset, color] = parseColor(sequence, i);
      if (color) {
        commands.push({
          type: "setBackgroundColor",
          value: color
        });
      }
      i += offset;
    } else if (codeInt === 49) {
      commands.push({
        type: "resetBackgroundColor"
      });
    } else if (codeInt >= 90 && codeInt <= 97) {
      commands.push({
        type: "setForegroundColor",
        value: { type: "named", name: namedColors[codeInt - 90 + 8] }
      });
    } else if (codeInt >= 100 && codeInt <= 107) {
      commands.push({
        type: "setBackgroundColor",
        value: { type: "named", name: namedColors[codeInt - 100 + 8] }
      });
    }
  }
  return commands;
}
function createAnsiSequenceParser() {
  let foreground = null;
  let background = null;
  let decorations2 = /* @__PURE__ */ new Set();
  return {
    parse(value) {
      const tokens = [];
      let position = 0;
      do {
        const findResult = findSequence(value, position);
        const text = findResult.sequence ? value.substring(position, findResult.startPosition) : value.substring(position);
        if (text.length > 0) {
          tokens.push({
            value: text,
            foreground,
            background,
            decorations: new Set(decorations2)
          });
        }
        if (findResult.sequence) {
          const commands = parseSequence(findResult.sequence);
          for (const styleToken of commands) {
            if (styleToken.type === "resetAll") {
              foreground = null;
              background = null;
              decorations2.clear();
            } else if (styleToken.type === "resetForegroundColor") {
              foreground = null;
            } else if (styleToken.type === "resetBackgroundColor") {
              background = null;
            } else if (styleToken.type === "resetDecoration") {
              decorations2.delete(styleToken.value);
            }
          }
          for (const styleToken of commands) {
            if (styleToken.type === "setForegroundColor") {
              foreground = styleToken.value;
            } else if (styleToken.type === "setBackgroundColor") {
              background = styleToken.value;
            } else if (styleToken.type === "setDecoration") {
              decorations2.add(styleToken.value);
            }
          }
        }
        position = findResult.position;
      } while (position < value.length);
      return tokens;
    }
  };
}

// src/palette.ts
var defaultNamedColorsMap = {
  black: "#000000",
  red: "#bb0000",
  green: "#00bb00",
  yellow: "#bbbb00",
  blue: "#0000bb",
  magenta: "#ff00ff",
  cyan: "#00bbbb",
  white: "#eeeeee",
  brightBlack: "#555555",
  brightRed: "#ff5555",
  brightGreen: "#00ff00",
  brightYellow: "#ffff55",
  brightBlue: "#5555ff",
  brightMagenta: "#ff55ff",
  brightCyan: "#55ffff",
  brightWhite: "#ffffff"
};
function createColorPalette(namedColorsMap = defaultNamedColorsMap) {
  function namedColor(name) {
    return namedColorsMap[name];
  }
  function rgbColor(rgb) {
    return `#${rgb.map((x) => Math.max(0, Math.min(x, 255)).toString(16).padStart(2, "0")).join("")}`;
  }
  let colorTable;
  function getColorTable() {
    if (colorTable) {
      return colorTable;
    }
    colorTable = [];
    for (let i = 0; i < namedColors.length; i++) {
      colorTable.push(namedColor(namedColors[i]));
    }
    let levels = [0, 95, 135, 175, 215, 255];
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          colorTable.push(rgbColor([levels[r], levels[g], levels[b]]));
        }
      }
    }
    let level = 8;
    for (let i = 0; i < 24; i++, level += 10) {
      colorTable.push(rgbColor([level, level, level]));
    }
    return colorTable;
  }
  function tableColor(index) {
    return getColorTable()[index];
  }
  function value(color) {
    switch (color.type) {
      case "named":
        return namedColor(color.name);
      case "rgb":
        return rgbColor(color.rgb);
      case "table":
        return tableColor(color.index);
    }
  }
  return {
    value
  };
}

function tokenizeAnsiWithTheme(theme, fileContents) {
  const lines = fileContents.split(/\r?\n/);
  const colorPalette = createColorPalette(
    Object.fromEntries(
      namedColors.map((name) => [
        name,
        theme.colors?.[`terminal.ansi${name[0].toUpperCase()}${name.substring(1)}`]
      ])
    )
  );
  const parser = createAnsiSequenceParser();
  return lines.map(
    (line) => parser.parse(line).map((token) => {
      let color;
      if (token.decorations.has("reverse"))
        color = token.background ? colorPalette.value(token.background) : theme.bg;
      else
        color = token.foreground ? colorPalette.value(token.foreground) : theme.fg;
      if (token.decorations.has("dim"))
        color = dimColor(color);
      let fontStyle = FontStyle.None;
      if (token.decorations.has("bold"))
        fontStyle |= FontStyle.Bold;
      if (token.decorations.has("italic"))
        fontStyle |= FontStyle.Italic;
      if (token.decorations.has("underline"))
        fontStyle |= FontStyle.Underline;
      return {
        content: token.value,
        color,
        fontStyle
      };
    })
  );
}
function dimColor(color) {
  const hexMatch = color.match(/#([0-9a-f]{3})([0-9a-f]{3})?([0-9a-f]{2})?/);
  if (hexMatch) {
    if (hexMatch[3]) {
      const alpha = Math.round(Number.parseInt(hexMatch[3], 16) / 2).toString(16).padStart(2, "0");
      return `#${hexMatch[1]}${hexMatch[2]}${alpha}`;
    } else if (hexMatch[2]) {
      return `#${hexMatch[1]}${hexMatch[2]}80`;
    } else {
      return `#${Array.from(hexMatch[1]).map((x) => `${x}${x}`).join("")}80`;
    }
  }
  const cssVarMatch = color.match(/var\((--shiki-color-ansi-[\w-]+)\)/);
  if (cssVarMatch)
    return `var(${cssVarMatch[1]}-dim)`;
  return color;
}

function codeToThemedTokens(context, code, options = {}) {
  const {
    lang = "text",
    theme: themeName = context.getLoadedThemes()[0],
    includeExplanation = true
  } = options;
  if (isPlaintext(lang)) {
    const lines = code.split(/\r\n|\r|\n/);
    return [...lines.map((line) => [{ content: line }])];
  }
  const { theme, colorMap } = context.setTheme(themeName);
  if (lang === "ansi")
    return tokenizeAnsiWithTheme(theme, code);
  const _grammar = context.getLangGrammar(lang);
  return tokenizeWithTheme(code, _grammar, theme, colorMap, {
    includeExplanation
  });
}
function tokenizeWithTheme(fileContents, grammar, theme, colorMap, options) {
  const lines = fileContents.split(/\r\n|\r|\n/);
  let ruleStack = mainExports.INITIAL;
  let actual = [];
  const final = [];
  for (let i = 0, len = lines.length; i < len; i++) {
    const line = lines[i];
    if (line === "") {
      actual = [];
      final.push([]);
      continue;
    }
    let resultWithScopes;
    let tokensWithScopes;
    let tokensWithScopesIndex;
    if (options.includeExplanation) {
      resultWithScopes = grammar.tokenizeLine(line, ruleStack);
      tokensWithScopes = resultWithScopes.tokens;
      tokensWithScopesIndex = 0;
    }
    const result = grammar.tokenizeLine2(line, ruleStack);
    const tokensLength = result.tokens.length / 2;
    for (let j = 0; j < tokensLength; j++) {
      const startIndex = result.tokens[2 * j];
      const nextStartIndex = j + 1 < tokensLength ? result.tokens[2 * j + 2] : line.length;
      if (startIndex === nextStartIndex)
        continue;
      const metadata = result.tokens[2 * j + 1];
      const foreground = StackElementMetadata.getForeground(metadata);
      const foregroundColor = colorMap[foreground];
      const fontStyle = StackElementMetadata.getFontStyle(metadata);
      const token = {
        content: line.substring(startIndex, nextStartIndex),
        color: foregroundColor,
        fontStyle
      };
      if (options.includeExplanation) {
        token.explanation = [];
        let offset = 0;
        while (startIndex + offset < nextStartIndex) {
          const tokenWithScopes = tokensWithScopes[tokensWithScopesIndex];
          const tokenWithScopesText = line.substring(
            tokenWithScopes.startIndex,
            tokenWithScopes.endIndex
          );
          offset += tokenWithScopesText.length;
          token.explanation.push({
            content: tokenWithScopesText,
            scopes: explainThemeScopes(theme, tokenWithScopes.scopes)
          });
          tokensWithScopesIndex += 1;
        }
      }
      actual.push(token);
    }
    final.push(actual);
    actual = [];
    ruleStack = result.ruleStack;
  }
  return final;
}
function explainThemeScopes(theme, scopes) {
  const result = [];
  for (let i = 0, len = scopes.length; i < len; i++) {
    const parentScopes = scopes.slice(0, i);
    const scope = scopes[i];
    result[i] = {
      scopeName: scope,
      themeMatches: explainThemeScope(theme, scope, parentScopes)
    };
  }
  return result;
}
function matchesOne(selector, scope) {
  const selectorPrefix = `${selector}.`;
  if (selector === scope || scope.substring(0, selectorPrefix.length) === selectorPrefix)
    return true;
  return false;
}
function matches(selector, selectorParentScopes, scope, parentScopes) {
  if (!matchesOne(selector, scope))
    return false;
  let selectorParentIndex = selectorParentScopes.length - 1;
  let parentIndex = parentScopes.length - 1;
  while (selectorParentIndex >= 0 && parentIndex >= 0) {
    if (matchesOne(selectorParentScopes[selectorParentIndex], parentScopes[parentIndex]))
      selectorParentIndex -= 1;
    parentIndex -= 1;
  }
  if (selectorParentIndex === -1)
    return true;
  return false;
}
function explainThemeScope(theme, scope, parentScopes) {
  const result = [];
  let resultLen = 0;
  for (let i = 0, len = theme.settings.length; i < len; i++) {
    const setting = theme.settings[i];
    let selectors;
    if (typeof setting.scope === "string")
      selectors = setting.scope.split(/,/).map((scope2) => scope2.trim());
    else if (Array.isArray(setting.scope))
      selectors = setting.scope;
    else
      continue;
    for (let j = 0, lenJ = selectors.length; j < lenJ; j++) {
      const rawSelector = selectors[j];
      const rawSelectorPieces = rawSelector.split(/ /);
      const selector = rawSelectorPieces[rawSelectorPieces.length - 1];
      const selectorParentScopes = rawSelectorPieces.slice(0, rawSelectorPieces.length - 1);
      if (matches(selector, selectorParentScopes, scope, parentScopes)) {
        result[resultLen++] = setting;
        j = lenJ;
      }
    }
  }
  return result;
}

function codeToTokensWithThemes(context, code, options) {
  const themes = Object.entries(options.themes).filter((i) => i[1]);
  const tokens = syncThemesTokenization(
    ...themes.map((t) => codeToThemedTokens(context, code, {
      ...options,
      theme: t[1],
      includeExplanation: false
    }))
  );
  return themes.map(([color, theme], idx) => [
    color,
    theme,
    tokens[idx]
  ]);
}
function syncThemesTokenization(...themes) {
  const outThemes = themes.map(() => []);
  const count = themes.length;
  for (let i = 0; i < themes[0].length; i++) {
    const lines = themes.map((t) => t[i]);
    const outLines = outThemes.map(() => []);
    outThemes.forEach((t, i2) => t.push(outLines[i2]));
    const indexes = lines.map(() => 0);
    const current = lines.map((l) => l[0]);
    while (current.every((t) => t)) {
      const minLength = Math.min(...current.map((t) => t.content.length));
      for (let n = 0; n < count; n++) {
        const token = current[n];
        if (token.content.length === minLength) {
          outLines[n].push(token);
          indexes[n] += 1;
          current[n] = lines[n][indexes[n]];
        } else {
          outLines[n].push({
            ...token,
            content: token.content.slice(0, minLength)
          });
          current[n] = {
            ...token,
            content: token.content.slice(minLength)
          };
        }
      }
    }
  }
  return outThemes;
}

function codeToHast(context, code, options) {
  let bg;
  let fg;
  let tokens;
  let themeName;
  let rootStyle;
  if ("themes" in options) {
    const {
      defaultColor = "light",
      cssVariablePrefix = "--shiki-"
    } = options;
    const themes = Object.entries(options.themes).filter((i) => i[1]);
    if (themes.length === 0)
      throw new Error("[shikiji] `themes` option must not be empty");
    const themeTokens = codeToTokensWithThemes(
      context,
      code,
      options
    ).sort((a) => a[0] === defaultColor ? -1 : 1);
    if (defaultColor && !themeTokens.find((t) => t[0] === defaultColor))
      throw new Error(`[shikiji] \`themes\` option must contain the defaultColor key \`${defaultColor}\``);
    const themeRegs = themeTokens.map((t) => context.getTheme(t[1]));
    const themeMap = themeTokens.map((t) => t[2]);
    tokens = [];
    for (let i = 0; i < themeMap[0].length; i++) {
      const lineMap = themeMap.map((t) => t[i]);
      const lineout = [];
      tokens.push(lineout);
      for (let j = 0; j < lineMap[0].length; j++) {
        const tokenMap = lineMap.map((t) => t[j]);
        const tokenStyles = tokenMap.map((t) => getTokenStyles(t));
        const styleKeys = new Set(tokenStyles.flatMap((t) => Object.keys(t)));
        const mergedStyles = tokenStyles.reduce((acc, cur, idx) => {
          for (const key of styleKeys) {
            const value = cur[key] || "inherit";
            if (idx === 0 && defaultColor) {
              acc[key] = value;
            } else {
              const varKey = cssVariablePrefix + themeTokens[idx][0] + (key === "color" ? "" : `-${key}`);
              if (acc[key])
                acc[key] += `;${varKey}:${value}`;
              else
                acc[key] = `${varKey}:${value}`;
            }
          }
          return acc;
        }, {});
        lineout.push({
          ...tokenMap[0],
          color: "",
          htmlStyle: defaultColor ? stringifyTokenStyle(mergedStyles) : Object.values(mergedStyles).join(";")
        });
      }
    }
    fg = themeTokens.map((t, idx) => (idx === 0 && defaultColor ? "" : `${cssVariablePrefix + t[0]}:`) + themeRegs[idx].fg).join(";");
    bg = themeTokens.map((t, idx) => (idx === 0 && defaultColor ? "" : `${cssVariablePrefix + t[0]}-bg:`) + themeRegs[idx].bg).join(";");
    themeName = `shiki-themes ${themeRegs.map((t) => t.name).join(" ")}`;
    rootStyle = defaultColor ? void 0 : [fg, bg].join(";");
  } else if ("theme" in options) {
    tokens = codeToThemedTokens(context, code, {
      ...options,
      includeExplanation: false
    });
    const _theme = context.getTheme(options.theme);
    bg = _theme.bg;
    fg = _theme.fg;
    themeName = _theme.name;
  } else {
    throw new Error("[shikiji] Invalid options, either `theme` or `themes` must be provided");
  }
  return tokensToHast(tokens, {
    ...options,
    fg,
    bg,
    themeName,
    rootStyle
  });
}
function tokensToHast(tokens, options) {
  const {
    mergeWhitespaces = true
  } = options;
  if (mergeWhitespaces)
    tokens = mergeWhitespaceTokens(tokens);
  const lines = [];
  const tree = {
    type: "root",
    children: []
  };
  let preNode = {
    type: "element",
    tagName: "pre",
    properties: {
      class: `shiki ${options.themeName || ""}`,
      style: options.rootStyle || `background-color:${options.bg};color:${options.fg}`,
      tabindex: "0",
      ...options.meta
    },
    children: []
  };
  let codeNode = {
    type: "element",
    tagName: "code",
    properties: {},
    children: lines
  };
  tokens.forEach((line, idx) => {
    if (idx)
      lines.push({ type: "text", value: "\n" });
    let lineNode = {
      type: "element",
      tagName: "span",
      properties: { class: "line" },
      children: []
    };
    let col = 0;
    for (const token of line) {
      let tokenNode = {
        type: "element",
        tagName: "span",
        properties: {},
        children: [{ type: "text", value: token.content }]
      };
      const style = token.htmlStyle || stringifyTokenStyle(getTokenStyles(token));
      if (style)
        tokenNode.properties.style = style;
      tokenNode = options.transforms?.token?.(tokenNode, idx + 1, col, lineNode) || tokenNode;
      lineNode.children.push(tokenNode);
      col += token.content.length;
    }
    lineNode = options.transforms?.line?.(lineNode, idx + 1) || lineNode;
    lines.push(lineNode);
  });
  codeNode = options.transforms?.code?.(codeNode) || codeNode;
  preNode.children.push(codeNode);
  preNode = options.transforms?.pre?.(preNode) || preNode;
  tree.children.push(preNode);
  return options.transforms?.root?.(tree) || tree;
}
function getTokenStyles(token) {
  const styles = {};
  if (token.color)
    styles.color = token.color;
  if (token.fontStyle) {
    if (token.fontStyle & FontStyle.Italic)
      styles["font-style"] = "italic";
    if (token.fontStyle & FontStyle.Bold)
      styles["font-weight"] = "bold";
    if (token.fontStyle & FontStyle.Underline)
      styles["text-decoration"] = "underline";
  }
  return styles;
}
function stringifyTokenStyle(token) {
  return Object.entries(token).map(([key, value]) => `${key}:${value}`).join(";");
}
function mergeWhitespaceTokens(tokens) {
  return tokens.map((line) => {
    const newLine = [];
    let carryOnContent = "";
    line.forEach((token, idx) => {
      if (token.content.match(/^\s+$/) && line[idx + 1]) {
        carryOnContent += token.content;
      } else {
        if (carryOnContent) {
          newLine.push({
            ...token,
            content: carryOnContent + token.content
          });
          carryOnContent = "";
        } else {
          newLine.push(token);
        }
      }
    });
    return newLine;
  });
}

function codeToHtml(context, code, options) {
  return toHtml(codeToHast(context, code, options));
}

async function getHighlighterCore(options = {}) {
  const context = await getShikiContext(options);
  return {
    codeToThemedTokens: (code, options2) => codeToThemedTokens(context, code, options2),
    codeToTokensWithThemes: (code, options2) => codeToTokensWithThemes(context, code, options2),
    codeToHast: (code, options2) => codeToHast(context, code, options2),
    codeToHtml: (code, options2) => codeToHtml(context, code, options2),
    loadLanguage: context.loadLanguage,
    loadTheme: context.loadTheme,
    getTheme: context.getTheme,
    getLoadedThemes: context.getLoadedThemes,
    getLoadedLanguages: context.getLoadedLanguages
  };
}

function createdBundledHighlighter(bundledLanguages, bundledThemes, ladWasm) {
  async function getHighlighter(options = {}) {
    function resolveLang(lang) {
      if (typeof lang === "string") {
        if (isSpecialLang(lang))
          return [];
        const bundle = bundledLanguages[lang];
        if (!bundle)
          throw new Error(`[shikiji] Language \`${lang}\` is not built-in.`);
        return bundle;
      }
      return lang;
    }
    function resolveTheme(theme) {
      if (typeof theme === "string") {
        const bundle = bundledThemes[theme];
        if (!bundle)
          throw new Error(`[shikiji] Theme \`${theme}\` is not built-in.`);
        return bundle;
      }
      return theme;
    }
    const _themes = (options.themes ?? []).map((i) => resolveTheme(i));
    const langs = (options.langs ?? []).map((i) => resolveLang(i));
    const core = await getHighlighterCore({
      ...options,
      themes: _themes,
      langs,
      loadWasm: ladWasm
    });
    return {
      ...core,
      loadLanguage(...langs2) {
        return core.loadLanguage(...langs2.map(resolveLang));
      },
      loadTheme(...themes) {
        return core.loadTheme(...themes.map(resolveTheme));
      }
    };
  }
  return getHighlighter;
}
function createSingletonShorthands(getHighlighter) {
  let _shiki;
  async function _getHighlighter(options) {
    if (!_shiki) {
      _shiki = getHighlighter({
        themes: toArray(options.theme),
        langs: toArray(options.lang)
      });
      return _shiki;
    } else {
      const s = await _shiki;
      await Promise.all([
        s.loadTheme(...toArray(options.theme)),
        s.loadLanguage(...toArray(options.lang))
      ]);
      return s;
    }
  }
  async function codeToHtml(code, options) {
    const shiki = await _getHighlighter({
      lang: options.lang,
      theme: "theme" in options ? [options.theme] : Object.values(options.themes)
    });
    return shiki.codeToHtml(code, options);
  }
  async function codeToHast(code, options) {
    const shiki = await _getHighlighter({
      lang: options.lang,
      theme: "theme" in options ? [options.theme] : Object.values(options.themes)
    });
    return shiki.codeToHast(code, options);
  }
  async function codeToThemedTokens(code, options) {
    const shiki = await _getHighlighter(options);
    return shiki.codeToThemedTokens(code, options);
  }
  async function codeToTokensWithThemes(code, options) {
    const shiki = await _getHighlighter({
      lang: options.lang,
      theme: Object.values(options.themes).filter(Boolean)
    });
    return shiki.codeToTokensWithThemes(code, options);
  }
  return {
    codeToHtml,
    codeToHast,
    codeToThemedTokens,
    codeToTokensWithThemes
  };
}

export { createSingletonShorthands, createdBundledHighlighter, getHighlighterCore, getShikiContext, loadWasm, toShikiTheme };
