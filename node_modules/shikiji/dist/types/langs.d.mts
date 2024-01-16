// ## Interfaces

/**
 * Info associated with nodes by the ecosystem.
 *
 * This space is guaranteed to never be specified by unist or specifications
 * implementing unist.
 * But you can use it in utilities and plugins to store data.
 *
 * This type can be augmented to register custom data.
 * For example:
 *
 * ```ts
 * declare module 'unist' {
 *   interface Data {
 *     // `someNode.data.myId` is typed as `number | undefined`
 *     myId?: number | undefined
 *   }
 * }
 * ```
 */
interface Data$1 {}

/**
 * One place in a source file.
 */
interface Point {
    /**
     * Line in a source file (1-indexed integer).
     */
    line: number;

    /**
     * Column in a source file (1-indexed integer).
     */
    column: number;
    /**
     * Character in a source file (0-indexed integer).
     */
    offset?: number | undefined;
}

/**
 * Position of a node in a source document.
 *
 * A position is a range between two points.
 */
interface Position {
    /**
     * Place of the first character of the parsed source region.
     */
    start: Point;

    /**
     * Place of the first character after the parsed source region.
     */
    end: Point;
}

/**
 * Abstract unist node.
 *
 * The syntactic unit in unist syntax trees are called nodes.
 *
 * This interface is supposed to be extended.
 * If you can use {@link Literal} or {@link Parent}, you should.
 * But for example in markdown, a `thematicBreak` (`***`), is neither literal
 * nor parent, but still a node.
 */
interface Node$1 {
    /**
     * Node type.
     */
    type: string;

    /**
     * Info from the ecosystem.
     */
    data?: Data$1 | undefined;

    /**
     * Position of a node in a source document.
     *
     * Nodes that are generated (not in the original source document) must not
     * have a position.
     */
    position?: Position | undefined;
}

// ## Interfaces

/**
 * Info associated with hast nodes by the ecosystem.
 *
 * This space is guaranteed to never be specified by unist or hast.
 * But you can use it in utilities and plugins to store data.
 *
 * This type can be augmented to register custom data.
 * For example:
 *
 * ```ts
 * declare module 'hast' {
 *   interface Data {
 *     // `someNode.data.myId` is typed as `number | undefined`
 *     myId?: number | undefined
 *   }
 * }
 * ```
 */
interface Data extends Data$1 {}

/**
 * Info associated with an element.
 */
interface Properties {
    [PropertyName: string]: boolean | number | string | null | undefined | Array<string | number>;
}

// ## Content maps

/**
 * Union of registered hast nodes that can occur in {@link Element}.
 *
 * To register mote custom hast nodes, add them to {@link ElementContentMap}.
 * They will be automatically added here.
 */
type ElementContent = ElementContentMap[keyof ElementContentMap];

/**
 * Registry of all hast nodes that can occur as children of {@link Element}.
 *
 * For a union of all {@link Element} children, see {@link ElementContent}.
 */
interface ElementContentMap {
    comment: Comment;
    element: Element;
    text: Text;
}

/**
 * Union of registered hast nodes that can occur in {@link Root}.
 *
 * To register custom hast nodes, add them to {@link RootContentMap}.
 * They will be automatically added here.
 */
type RootContent = RootContentMap[keyof RootContentMap];

/**
 * Registry of all hast nodes that can occur as children of {@link Root}.
 *
 * > 👉 **Note**: {@link Root} does not need to be an entire document.
 * > it can also be a fragment.
 *
 * For a union of all {@link Root} children, see {@link RootContent}.
 */
interface RootContentMap {
    comment: Comment;
    doctype: Doctype;
    element: Element;
    text: Text;
}

// ## Abstract nodes

/**
 * Abstract hast node.
 *
 * This interface is supposed to be extended.
 * If you can use {@link Literal} or {@link Parent}, you should.
 * But for example in HTML, a `Doctype` is neither literal nor parent, but
 * still a node.
 *
 * To register custom hast nodes, add them to {@link RootContentMap} and other
 * places where relevant (such as {@link ElementContentMap}).
 *
 * For a union of all registered hast nodes, see {@link Nodes}.
 */
interface Node extends Node$1 {
    /**
     * Info from the ecosystem.
     */
    data?: Data | undefined;
}

/**
 * Abstract hast node that contains the smallest possible value.
 *
 * This interface is supposed to be extended if you make custom hast nodes.
 *
 * For a union of all registered hast literals, see {@link Literals}.
 */
interface Literal extends Node {
    /**
     * Plain-text value.
     */
    value: string;
}

/**
 * Abstract hast node that contains other hast nodes (*children*).
 *
 * This interface is supposed to be extended if you make custom hast nodes.
 *
 * For a union of all registered hast parents, see {@link Parents}.
 */
interface Parent extends Node {
    /**
     * List of children.
     */
    children: RootContent[];
}

// ## Concrete nodes

/**
 * HTML comment.
 */
interface Comment extends Literal {
    /**
     * Node type of HTML comments in hast.
     */
    type: "comment";
    /**
     * Data associated with the comment.
     */
    data?: CommentData | undefined;
}

/**
 * Info associated with hast comments by the ecosystem.
 */
interface CommentData extends Data {}

/**
 * HTML document type.
 */
interface Doctype extends Node$1 {
    /**
     * Node type of HTML document types in hast.
     */
    type: "doctype";
    /**
     * Data associated with the doctype.
     */
    data?: DoctypeData | undefined;
}

/**
 * Info associated with hast doctypes by the ecosystem.
 */
interface DoctypeData extends Data {}

/**
 * HTML element.
 */
interface Element extends Parent {
    /**
     * Node type of elements.
     */
    type: "element";
    /**
     * Tag name (such as `'body'`) of the element.
     */
    tagName: string;
    /**
     * Info associated with the element.
     */
    properties: Properties;
    /**
     * Children of element.
     */
    children: ElementContent[];
    /**
     * When the `tagName` field is `'template'`, a `content` field can be
     * present.
     */
    content?: Root | undefined;
    /**
     * Data associated with the element.
     */
    data?: ElementData | undefined;
}

/**
 * Info associated with hast elements by the ecosystem.
 */
interface ElementData extends Data {}

/**
 * Document fragment or a whole document.
 *
 * Should be used as the root of a tree and must not be used as a child.
 *
 * Can also be used as the value for the content field on a `'template'` element.
 */
interface Root extends Parent {
    /**
     * Node type of hast root.
     */
    type: "root";
    /**
     * Children of root.
     */
    children: RootContent[];
    /**
     * Data associated with the hast root.
     */
    data?: RootData | undefined;
}

/**
 * Info associated with hast root nodes by the ecosystem.
 */
interface RootData extends Data {}

/**
 * HTML character data (plain text).
 */
interface Text extends Literal {
    /**
     * Node type of HTML character data (plain text) in hast.
     */
    type: "text";
    /**
     * Data associated with the text.
     */
    data?: TextData | undefined;
}

/**
 * Info associated with hast texts by the ecosystem.
 */
interface TextData extends Data {}

declare const ruleIdSymbol: unique symbol;
declare type RuleId = {
    __brand: typeof ruleIdSymbol;
};

/**
 * Identifiers with a binary dot operator.
 * Examples: `baz` or `foo.bar`
*/
declare type ScopeName = string;
/**
 * An expression language of ScopePathStr with a binary comma (to indicate alternatives) operator.
 * Examples: `foo.bar boo.baz,quick quack`
*/
declare type ScopePattern = string;
/**
 * A TextMate theme.
 */
interface IRawTheme {
    readonly name?: string;
    readonly settings: IRawThemeSetting[];
}
/**
 * A single theme setting.
 */
interface IRawThemeSetting {
    readonly name?: string;
    readonly scope?: ScopePattern | ScopePattern[];
    readonly settings: {
        readonly fontStyle?: string;
        readonly foreground?: string;
        readonly background?: string;
    };
}

interface IRawGrammar extends ILocatable {
    repository: IRawRepository;
    readonly scopeName: ScopeName;
    readonly patterns: IRawRule[];
    readonly injections?: {
        [expression: string]: IRawRule;
    };
    readonly injectionSelector?: string;
    readonly fileTypes?: string[];
    readonly name?: string;
    readonly firstLineMatch?: string;
}
/**
 * Allowed values:
 * * Scope Name, e.g. `source.ts`
 * * Top level scope reference, e.g. `source.ts#entity.name.class`
 * * Relative scope reference, e.g. `#entity.name.class`
 * * self, e.g. `$self`
 * * base, e.g. `$base`
 */
declare type IncludeString = string;
declare type RegExpString = string;
interface IRawRepositoryMap {
    [name: string]: IRawRule;
    $self: IRawRule;
    $base: IRawRule;
}
declare type IRawRepository = IRawRepositoryMap & ILocatable;
interface IRawRule extends ILocatable {
    id?: RuleId;
    readonly include?: IncludeString;
    readonly name?: ScopeName;
    readonly contentName?: ScopeName;
    readonly match?: RegExpString;
    readonly captures?: IRawCaptures;
    readonly begin?: RegExpString;
    readonly beginCaptures?: IRawCaptures;
    readonly end?: RegExpString;
    readonly endCaptures?: IRawCaptures;
    readonly while?: RegExpString;
    readonly whileCaptures?: IRawCaptures;
    readonly patterns?: IRawRule[];
    readonly repository?: IRawRepository;
    readonly applyEndPatternLast?: boolean;
}
declare type IRawCaptures = IRawCapturesMap & ILocatable;
interface IRawCapturesMap {
    [captureId: string]: IRawRule;
}
interface ILocation {
    readonly filename: string;
    readonly line: number;
    readonly char: number;
}
interface ILocatable {
    readonly $vscodeTextmateLocation?: ILocation;
}

/**
 * A grammar
 */
interface IGrammar {
    /**
     * Tokenize `lineText` using previous line state `prevState`.
     */
    tokenizeLine(lineText: string, prevState: StateStack | null, timeLimit?: number): ITokenizeLineResult;
    /**
     * Tokenize `lineText` using previous line state `prevState`.
     * The result contains the tokens in binary format, resolved with the following information:
     *  - language
     *  - token type (regex, string, comment, other)
     *  - font style
     *  - foreground color
     *  - background color
     * e.g. for getting the languageId: `(metadata & MetadataConsts.LANGUAGEID_MASK) >>> MetadataConsts.LANGUAGEID_OFFSET`
     */
    tokenizeLine2(lineText: string, prevState: StateStack | null, timeLimit?: number): ITokenizeLineResult2;
}
interface ITokenizeLineResult {
    readonly tokens: IToken[];
    /**
     * The `prevState` to be passed on to the next line tokenization.
     */
    readonly ruleStack: StateStack;
    /**
     * Did tokenization stop early due to reaching the time limit.
     */
    readonly stoppedEarly: boolean;
}
interface ITokenizeLineResult2 {
    /**
     * The tokens in binary format. Each token occupies two array indices. For token i:
     *  - at offset 2*i => startIndex
     *  - at offset 2*i + 1 => metadata
     *
     */
    readonly tokens: Uint32Array;
    /**
     * The `prevState` to be passed on to the next line tokenization.
     */
    readonly ruleStack: StateStack;
    /**
     * Did tokenization stop early due to reaching the time limit.
     */
    readonly stoppedEarly: boolean;
}
interface IToken {
    startIndex: number;
    readonly endIndex: number;
    readonly scopes: string[];
}
/**
 * **IMPORTANT** - Immutable!
 */
interface StateStack {
    _stackElementBrand: void;
    readonly depth: number;
    clone(): StateStack;
    equals(other: StateStack): boolean;
}

/**
 * Generated by scripts/prepare.ts
 */

type DynamicThemeReg = () => Promise<{
    default: ThemeRegistrationRaw;
}>;
declare const bundledThemes: {
    "css-variables": DynamicThemeReg;
    "dark-plus": DynamicThemeReg;
    dracula: DynamicThemeReg;
    "dracula-soft": DynamicThemeReg;
    "github-dark": DynamicThemeReg;
    "github-dark-dimmed": DynamicThemeReg;
    "github-light": DynamicThemeReg;
    hc_light: DynamicThemeReg;
    "light-plus": DynamicThemeReg;
    "material-theme": DynamicThemeReg;
    "material-theme-darker": DynamicThemeReg;
    "material-theme-lighter": DynamicThemeReg;
    "material-theme-ocean": DynamicThemeReg;
    "material-theme-palenight": DynamicThemeReg;
    "min-dark": DynamicThemeReg;
    "min-light": DynamicThemeReg;
    monokai: DynamicThemeReg;
    nord: DynamicThemeReg;
    "one-dark-pro": DynamicThemeReg;
    poimandres: DynamicThemeReg;
    "rose-pine": DynamicThemeReg;
    "rose-pine-dawn": DynamicThemeReg;
    "rose-pine-moon": DynamicThemeReg;
    "slack-dark": DynamicThemeReg;
    "slack-ochin": DynamicThemeReg;
    "solarized-dark": DynamicThemeReg;
    "solarized-light": DynamicThemeReg;
    "vitesse-dark": DynamicThemeReg;
    "vitesse-light": DynamicThemeReg;
};

/**
 * Generated by scripts/prepare.ts
 */

type DynamicLangReg = () => Promise<{
    default: LanguageRegistration[];
}>;
declare const bundledLanguagesBase: {
    abap: DynamicLangReg;
    'actionscript-3': DynamicLangReg;
    ada: DynamicLangReg;
    apache: DynamicLangReg;
    apex: DynamicLangReg;
    apl: DynamicLangReg;
    applescript: DynamicLangReg;
    ara: DynamicLangReg;
    asm: DynamicLangReg;
    astro: DynamicLangReg;
    awk: DynamicLangReg;
    ballerina: DynamicLangReg;
    bat: DynamicLangReg;
    beancount: DynamicLangReg;
    berry: DynamicLangReg;
    bibtex: DynamicLangReg;
    bicep: DynamicLangReg;
    blade: DynamicLangReg;
    c: DynamicLangReg;
    cadence: DynamicLangReg;
    clarity: DynamicLangReg;
    clojure: DynamicLangReg;
    cmake: DynamicLangReg;
    cobol: DynamicLangReg;
    codeql: DynamicLangReg;
    coffee: DynamicLangReg;
    cpp: DynamicLangReg;
    crystal: DynamicLangReg;
    csharp: DynamicLangReg;
    css: DynamicLangReg;
    cue: DynamicLangReg;
    cypher: DynamicLangReg;
    d: DynamicLangReg;
    dart: DynamicLangReg;
    dax: DynamicLangReg;
    diff: DynamicLangReg;
    docker: DynamicLangReg;
    'dream-maker': DynamicLangReg;
    elixir: DynamicLangReg;
    elm: DynamicLangReg;
    erb: DynamicLangReg;
    erlang: DynamicLangReg;
    fish: DynamicLangReg;
    fsharp: DynamicLangReg;
    gdresource: DynamicLangReg;
    gdscript: DynamicLangReg;
    gdshader: DynamicLangReg;
    gherkin: DynamicLangReg;
    'git-commit': DynamicLangReg;
    'git-rebase': DynamicLangReg;
    'glimmer-js': DynamicLangReg;
    'glimmer-ts': DynamicLangReg;
    glsl: DynamicLangReg;
    gnuplot: DynamicLangReg;
    go: DynamicLangReg;
    graphql: DynamicLangReg;
    groovy: DynamicLangReg;
    hack: DynamicLangReg;
    haml: DynamicLangReg;
    handlebars: DynamicLangReg;
    haskell: DynamicLangReg;
    hcl: DynamicLangReg;
    hjson: DynamicLangReg;
    hlsl: DynamicLangReg;
    html: DynamicLangReg;
    http: DynamicLangReg;
    imba: DynamicLangReg;
    ini: DynamicLangReg;
    java: DynamicLangReg;
    javascript: DynamicLangReg;
    'jinja-html': DynamicLangReg;
    jison: DynamicLangReg;
    json: DynamicLangReg;
    json5: DynamicLangReg;
    jsonc: DynamicLangReg;
    jsonl: DynamicLangReg;
    jsonnet: DynamicLangReg;
    jssm: DynamicLangReg;
    jsx: DynamicLangReg;
    julia: DynamicLangReg;
    kotlin: DynamicLangReg;
    kusto: DynamicLangReg;
    latex: DynamicLangReg;
    less: DynamicLangReg;
    liquid: DynamicLangReg;
    lisp: DynamicLangReg;
    logo: DynamicLangReg;
    lua: DynamicLangReg;
    make: DynamicLangReg;
    markdown: DynamicLangReg;
    marko: DynamicLangReg;
    matlab: DynamicLangReg;
    mdc: DynamicLangReg;
    mdx: DynamicLangReg;
    mermaid: DynamicLangReg;
    mojo: DynamicLangReg;
    narrat: DynamicLangReg;
    nextflow: DynamicLangReg;
    nginx: DynamicLangReg;
    nim: DynamicLangReg;
    nix: DynamicLangReg;
    'objective-c': DynamicLangReg;
    'objective-cpp': DynamicLangReg;
    ocaml: DynamicLangReg;
    pascal: DynamicLangReg;
    perl: DynamicLangReg;
    php: DynamicLangReg;
    plsql: DynamicLangReg;
    postcss: DynamicLangReg;
    powerquery: DynamicLangReg;
    powershell: DynamicLangReg;
    prisma: DynamicLangReg;
    prolog: DynamicLangReg;
    proto: DynamicLangReg;
    pug: DynamicLangReg;
    puppet: DynamicLangReg;
    purescript: DynamicLangReg;
    python: DynamicLangReg;
    r: DynamicLangReg;
    raku: DynamicLangReg;
    razor: DynamicLangReg;
    reg: DynamicLangReg;
    rel: DynamicLangReg;
    riscv: DynamicLangReg;
    rst: DynamicLangReg;
    ruby: DynamicLangReg;
    rust: DynamicLangReg;
    sas: DynamicLangReg;
    sass: DynamicLangReg;
    scala: DynamicLangReg;
    scheme: DynamicLangReg;
    scss: DynamicLangReg;
    shaderlab: DynamicLangReg;
    shellscript: DynamicLangReg;
    shellsession: DynamicLangReg;
    smalltalk: DynamicLangReg;
    solidity: DynamicLangReg;
    sparql: DynamicLangReg;
    splunk: DynamicLangReg;
    sql: DynamicLangReg;
    'ssh-config': DynamicLangReg;
    stata: DynamicLangReg;
    stylus: DynamicLangReg;
    svelte: DynamicLangReg;
    swift: DynamicLangReg;
    'system-verilog': DynamicLangReg;
    tasl: DynamicLangReg;
    tcl: DynamicLangReg;
    tex: DynamicLangReg;
    toml: DynamicLangReg;
    tsx: DynamicLangReg;
    turtle: DynamicLangReg;
    twig: DynamicLangReg;
    typescript: DynamicLangReg;
    v: DynamicLangReg;
    vb: DynamicLangReg;
    verilog: DynamicLangReg;
    vhdl: DynamicLangReg;
    viml: DynamicLangReg;
    vue: DynamicLangReg;
    'vue-html': DynamicLangReg;
    vyper: DynamicLangReg;
    wasm: DynamicLangReg;
    wenyan: DynamicLangReg;
    wgsl: DynamicLangReg;
    wolfram: DynamicLangReg;
    xml: DynamicLangReg;
    xsl: DynamicLangReg;
    yaml: DynamicLangReg;
    zenscript: DynamicLangReg;
    zig: DynamicLangReg;
};
declare const bundledLanguagesAlias: {
    bash: DynamicLangReg;
    batch: DynamicLangReg;
    be: DynamicLangReg;
    'c#': DynamicLangReg;
    'c++': DynamicLangReg;
    cdc: DynamicLangReg;
    clj: DynamicLangReg;
    cmd: DynamicLangReg;
    console: DynamicLangReg;
    cql: DynamicLangReg;
    cs: DynamicLangReg;
    dockerfile: DynamicLangReg;
    erl: DynamicLangReg;
    'f#': DynamicLangReg;
    fs: DynamicLangReg;
    fsl: DynamicLangReg;
    gjs: DynamicLangReg;
    gql: DynamicLangReg;
    gts: DynamicLangReg;
    hbs: DynamicLangReg;
    hs: DynamicLangReg;
    jade: DynamicLangReg;
    js: DynamicLangReg;
    kql: DynamicLangReg;
    kt: DynamicLangReg;
    kts: DynamicLangReg;
    makefile: DynamicLangReg;
    md: DynamicLangReg;
    nar: DynamicLangReg;
    nf: DynamicLangReg;
    objc: DynamicLangReg;
    perl6: DynamicLangReg;
    properties: DynamicLangReg;
    ps: DynamicLangReg;
    ps1: DynamicLangReg;
    py: DynamicLangReg;
    ql: DynamicLangReg;
    rb: DynamicLangReg;
    rs: DynamicLangReg;
    sh: DynamicLangReg;
    shader: DynamicLangReg;
    shell: DynamicLangReg;
    spl: DynamicLangReg;
    styl: DynamicLangReg;
    ts: DynamicLangReg;
    vim: DynamicLangReg;
    vimscript: DynamicLangReg;
    vy: DynamicLangReg;
    yml: DynamicLangReg;
    zsh: DynamicLangReg;
    文言: DynamicLangReg;
};
declare const bundledLanguages: {
    bash: DynamicLangReg;
    batch: DynamicLangReg;
    be: DynamicLangReg;
    'c#': DynamicLangReg;
    'c++': DynamicLangReg;
    cdc: DynamicLangReg;
    clj: DynamicLangReg;
    cmd: DynamicLangReg;
    console: DynamicLangReg;
    cql: DynamicLangReg;
    cs: DynamicLangReg;
    dockerfile: DynamicLangReg;
    erl: DynamicLangReg;
    'f#': DynamicLangReg;
    fs: DynamicLangReg;
    fsl: DynamicLangReg;
    gjs: DynamicLangReg;
    gql: DynamicLangReg;
    gts: DynamicLangReg;
    hbs: DynamicLangReg;
    hs: DynamicLangReg;
    jade: DynamicLangReg;
    js: DynamicLangReg;
    kql: DynamicLangReg;
    kt: DynamicLangReg;
    kts: DynamicLangReg;
    makefile: DynamicLangReg;
    md: DynamicLangReg;
    nar: DynamicLangReg;
    nf: DynamicLangReg;
    objc: DynamicLangReg;
    perl6: DynamicLangReg;
    properties: DynamicLangReg;
    ps: DynamicLangReg;
    ps1: DynamicLangReg;
    py: DynamicLangReg;
    ql: DynamicLangReg;
    rb: DynamicLangReg;
    rs: DynamicLangReg;
    sh: DynamicLangReg;
    shader: DynamicLangReg;
    shell: DynamicLangReg;
    spl: DynamicLangReg;
    styl: DynamicLangReg;
    ts: DynamicLangReg;
    vim: DynamicLangReg;
    vimscript: DynamicLangReg;
    vy: DynamicLangReg;
    yml: DynamicLangReg;
    zsh: DynamicLangReg;
    文言: DynamicLangReg;
    abap: DynamicLangReg;
    'actionscript-3': DynamicLangReg;
    ada: DynamicLangReg;
    apache: DynamicLangReg;
    apex: DynamicLangReg;
    apl: DynamicLangReg;
    applescript: DynamicLangReg;
    ara: DynamicLangReg;
    asm: DynamicLangReg;
    astro: DynamicLangReg;
    awk: DynamicLangReg;
    ballerina: DynamicLangReg;
    bat: DynamicLangReg;
    beancount: DynamicLangReg;
    berry: DynamicLangReg;
    bibtex: DynamicLangReg;
    bicep: DynamicLangReg;
    blade: DynamicLangReg;
    c: DynamicLangReg;
    cadence: DynamicLangReg;
    clarity: DynamicLangReg;
    clojure: DynamicLangReg;
    cmake: DynamicLangReg;
    cobol: DynamicLangReg;
    codeql: DynamicLangReg;
    coffee: DynamicLangReg;
    cpp: DynamicLangReg;
    crystal: DynamicLangReg;
    csharp: DynamicLangReg;
    css: DynamicLangReg;
    cue: DynamicLangReg;
    cypher: DynamicLangReg;
    d: DynamicLangReg;
    dart: DynamicLangReg;
    dax: DynamicLangReg;
    diff: DynamicLangReg;
    docker: DynamicLangReg;
    'dream-maker': DynamicLangReg;
    elixir: DynamicLangReg;
    elm: DynamicLangReg;
    erb: DynamicLangReg;
    erlang: DynamicLangReg;
    fish: DynamicLangReg;
    fsharp: DynamicLangReg;
    gdresource: DynamicLangReg;
    gdscript: DynamicLangReg;
    gdshader: DynamicLangReg;
    gherkin: DynamicLangReg;
    'git-commit': DynamicLangReg;
    'git-rebase': DynamicLangReg;
    'glimmer-js': DynamicLangReg;
    'glimmer-ts': DynamicLangReg;
    glsl: DynamicLangReg;
    gnuplot: DynamicLangReg;
    go: DynamicLangReg;
    graphql: DynamicLangReg;
    groovy: DynamicLangReg;
    hack: DynamicLangReg;
    haml: DynamicLangReg;
    handlebars: DynamicLangReg;
    haskell: DynamicLangReg;
    hcl: DynamicLangReg;
    hjson: DynamicLangReg;
    hlsl: DynamicLangReg;
    html: DynamicLangReg;
    http: DynamicLangReg;
    imba: DynamicLangReg;
    ini: DynamicLangReg;
    java: DynamicLangReg;
    javascript: DynamicLangReg;
    'jinja-html': DynamicLangReg;
    jison: DynamicLangReg;
    json: DynamicLangReg;
    json5: DynamicLangReg;
    jsonc: DynamicLangReg;
    jsonl: DynamicLangReg;
    jsonnet: DynamicLangReg;
    jssm: DynamicLangReg;
    jsx: DynamicLangReg;
    julia: DynamicLangReg;
    kotlin: DynamicLangReg;
    kusto: DynamicLangReg;
    latex: DynamicLangReg;
    less: DynamicLangReg;
    liquid: DynamicLangReg;
    lisp: DynamicLangReg;
    logo: DynamicLangReg;
    lua: DynamicLangReg;
    make: DynamicLangReg;
    markdown: DynamicLangReg;
    marko: DynamicLangReg;
    matlab: DynamicLangReg;
    mdc: DynamicLangReg;
    mdx: DynamicLangReg;
    mermaid: DynamicLangReg;
    mojo: DynamicLangReg;
    narrat: DynamicLangReg;
    nextflow: DynamicLangReg;
    nginx: DynamicLangReg;
    nim: DynamicLangReg;
    nix: DynamicLangReg;
    'objective-c': DynamicLangReg;
    'objective-cpp': DynamicLangReg;
    ocaml: DynamicLangReg;
    pascal: DynamicLangReg;
    perl: DynamicLangReg;
    php: DynamicLangReg;
    plsql: DynamicLangReg;
    postcss: DynamicLangReg;
    powerquery: DynamicLangReg;
    powershell: DynamicLangReg;
    prisma: DynamicLangReg;
    prolog: DynamicLangReg;
    proto: DynamicLangReg;
    pug: DynamicLangReg;
    puppet: DynamicLangReg;
    purescript: DynamicLangReg;
    python: DynamicLangReg;
    r: DynamicLangReg;
    raku: DynamicLangReg;
    razor: DynamicLangReg;
    reg: DynamicLangReg;
    rel: DynamicLangReg;
    riscv: DynamicLangReg;
    rst: DynamicLangReg;
    ruby: DynamicLangReg;
    rust: DynamicLangReg;
    sas: DynamicLangReg;
    sass: DynamicLangReg;
    scala: DynamicLangReg;
    scheme: DynamicLangReg;
    scss: DynamicLangReg;
    shaderlab: DynamicLangReg;
    shellscript: DynamicLangReg;
    shellsession: DynamicLangReg;
    smalltalk: DynamicLangReg;
    solidity: DynamicLangReg;
    sparql: DynamicLangReg;
    splunk: DynamicLangReg;
    sql: DynamicLangReg;
    'ssh-config': DynamicLangReg;
    stata: DynamicLangReg;
    stylus: DynamicLangReg;
    svelte: DynamicLangReg;
    swift: DynamicLangReg;
    'system-verilog': DynamicLangReg;
    tasl: DynamicLangReg;
    tcl: DynamicLangReg;
    tex: DynamicLangReg;
    toml: DynamicLangReg;
    tsx: DynamicLangReg;
    turtle: DynamicLangReg;
    twig: DynamicLangReg;
    typescript: DynamicLangReg;
    v: DynamicLangReg;
    vb: DynamicLangReg;
    verilog: DynamicLangReg;
    vhdl: DynamicLangReg;
    viml: DynamicLangReg;
    vue: DynamicLangReg;
    'vue-html': DynamicLangReg;
    vyper: DynamicLangReg;
    wasm: DynamicLangReg;
    wenyan: DynamicLangReg;
    wgsl: DynamicLangReg;
    wolfram: DynamicLangReg;
    xml: DynamicLangReg;
    xsl: DynamicLangReg;
    yaml: DynamicLangReg;
    zenscript: DynamicLangReg;
    zig: DynamicLangReg;
};

declare enum FontStyle {
    NotSet = -1,
    None = 0,
    Italic = 1,
    Bold = 2,
    Underline = 4
}

interface WebAssemblyInstantiator {
    (importObject: Record<string, Record<string, WebAssembly.ImportValue>> | undefined): Promise<WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance>;
}
interface ICommonOptions {
    print?(str: string): void;
}
interface IInstantiatorOptions extends ICommonOptions {
    instantiator: WebAssemblyInstantiator;
}
interface IDataOptions extends ICommonOptions {
    data: ArrayBufferView | ArrayBuffer | Response;
}
type OnigurumaLoadOptions = IInstantiatorOptions | IDataOptions;
declare function loadWasm(loader: WebAssemblyInstantiator): Promise<void>;
declare function loadWasm(options: OnigurumaLoadOptions): Promise<void>;
declare function loadWasm(data: ArrayBufferView | ArrayBuffer | Response): Promise<void>;

type BuiltinLanguage = keyof typeof bundledLanguages;
type BuiltinTheme = keyof typeof bundledThemes;
type PlainTextLanguage = 'text' | 'plaintext' | 'txt';
type AnsiLanguage = 'ansi';
type SpecialLanguage = PlainTextLanguage | AnsiLanguage;
type Awaitable<T> = T | Promise<T>;
type MaybeGetter<T> = Awaitable<MaybeModule<T>> | (() => Awaitable<MaybeModule<T>>);
type MaybeModule<T> = T | {
    default: T;
};
type MaybeArray<T> = T | T[];
type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type ThemeInput = MaybeGetter<ThemeRegistration | ThemeRegistrationRaw>;
type LanguageInput = MaybeGetter<MaybeArray<LanguageRegistration>>;
interface Nothing {
}
/**
 * type StringLiteralUnion<'foo'> = 'foo' | string
 * This has auto completion whereas `'foo' | string` doesn't
 * Adapted from https://github.com/microsoft/TypeScript/issues/29729
 */
type StringLiteralUnion<T extends U, U = string> = T | (U & Nothing);
type ResolveBundleKey<T extends string> = never extends T ? string : T;
interface ShikiContext {
    setTheme(name: string | ThemeRegistration | ThemeRegistrationRaw): {
        theme: ThemeRegistration;
        colorMap: string[];
    };
    getTheme(name: string | ThemeRegistration | ThemeRegistrationRaw): ThemeRegistration;
    getLangGrammar(name: string): IGrammar;
    getLoadedThemes(): string[];
    getLoadedLanguages(): string[];
    loadLanguage(...langs: LanguageInput[]): Promise<void>;
    loadTheme(...themes: ThemeInput[]): Promise<void>;
}
interface HighlighterGeneric<BundledLangKeys extends string, BundledThemeKeys extends string> {
    codeToHtml(code: string, options: CodeToHastOptions<ResolveBundleKey<BundledLangKeys>, ResolveBundleKey<BundledThemeKeys>>): string;
    codeToThemedTokens(code: string, options: CodeToThemedTokensOptions<ResolveBundleKey<BundledLangKeys>, ResolveBundleKey<BundledThemeKeys>>): ThemedToken[][];
    codeToTokensWithThemes(code: string, options: CodeToTokensWithThemesOptions<ResolveBundleKey<BundledLangKeys>, ResolveBundleKey<BundledThemeKeys>>): [color: string, theme: string, tokens: ThemedToken[][]][];
    codeToHast(code: string, options: CodeToHastOptions<ResolveBundleKey<BundledLangKeys>, ResolveBundleKey<BundledThemeKeys>>): Root;
    loadTheme(...themes: (ThemeInput | BundledThemeKeys)[]): Promise<void>;
    loadLanguage(...langs: (LanguageInput | BundledLangKeys | SpecialLanguage)[]): Promise<void>;
    getTheme(name: string | ThemeRegistration | ThemeRegistrationRaw): ThemeRegistration;
    getLoadedLanguages(): string[];
    getLoadedThemes(): string[];
}
interface HighlighterCoreOptions {
    themes?: ThemeInput[];
    langs?: LanguageInput[];
    loadWasm?: OnigurumaLoadOptions | (() => Promise<OnigurumaLoadOptions>);
}
interface BundledHighlighterOptions<L extends string, T extends string> {
    /**
     * Theme registation
     *
     * @default []
     */
    themes?: (ThemeInput | StringLiteralUnion<T>)[];
    /**
     * Language registation
     *
     * @default Object.keys(bundledThemes)
     */
    langs?: (LanguageInput | StringLiteralUnion<L> | SpecialLanguage)[];
}
interface LanguageRegistration extends IRawGrammar {
    name: string;
    scopeName: string;
    displayName?: string;
    aliases?: string[];
    /**
     * A list of languages the current language embeds.
     * If manually specifying languages to load, make sure to load the embedded
     * languages for each parent language.
     */
    embeddedLangs?: string[];
    balancedBracketSelectors?: string[];
    unbalancedBracketSelectors?: string[];
}
interface CodeToThemedTokensOptions<Languages = string, Themes = string> {
    lang?: Languages | SpecialLanguage;
    theme?: Themes | ThemeRegistration | ThemeRegistrationRaw;
    /**
     * Include explanation of why a token is given a color.
     *
     * @default true
     */
    includeExplanation?: boolean;
}
interface CodeToHastOptionsCommon<Languages extends string = string> {
    lang: StringLiteralUnion<Languages | SpecialLanguage>;
    /**
     * Transform the generated HAST tree.
     */
    transforms?: HastTransformers;
}
interface CodeToTokensWithThemesOptions<Languages = string, Themes = string> {
    lang?: Languages | SpecialLanguage;
    /**
     * A map of color names to themes.
     *
     * `light` and `dark` are required, and arbitrary color names can be added.
     *
     * @example
     * ```ts
     * themes: {
     *   light: 'vitesse-light',
     *   dark: 'vitesse-dark',
     *   soft: 'nord',
     *   // custom colors
     * }
     * ```
     */
    themes: Partial<Record<string, Themes | ThemeRegistration | ThemeRegistrationRaw>>;
}
interface CodeOptionsSingleTheme<Themes extends string = string> {
    theme: ThemeRegistration | ThemeRegistrationRaw | StringLiteralUnion<Themes>;
}
interface CodeOptionsMultipleThemes<Themes extends string = string> {
    /**
     * A map of color names to themes.
     * This allows you to specify multiple themes for the generated code.
     *
     * ```ts
     * shiki.codeToHtml(code, {
     *  lang: 'js',
     *  themes: {
     *    light: 'vitesse-light',
     *    dark: 'vitesse-dark',
     *  }
     * })
     * ```
     *
     * Will generate:
     *
     * ```html
     * <span style="color:#111;--shiki-dark:#fff;">code</span>
     * ```
     *
     * @see https://github.com/antfu/shikiji#lightdark-dual-themes
     */
    themes: Partial<Record<string, ThemeRegistration | ThemeRegistrationRaw | StringLiteralUnion<Themes>>>;
    /**
     * The default theme applied to the code (via inline `color` style).
     * The rest of the themes are applied via CSS variables, and toggled by CSS overrides.
     *
     * For example, if `defaultColor` is `light`, then `light` theme is applied to the code,
     * and the `dark` theme and other custom themes are applied via CSS variables:
     *
     * ```html
     * <span style="color:#{light};--shiki-dark:#{dark};--shiki-custom:#{custom};">code</span>
     * ```
     *
     * When set to `false`, no default styles will be applied, and totally up to users to apply the styles:
     *
     * ```html
     * <span style="--shiki-light:#{light};--shiki-dark:#{dark};--shiki-custom:#{custom};">code</span>
     * ```
     *
     *
     * @default 'light'
     */
    defaultColor?: StringLiteralUnion<'light' | 'dark'> | false;
    /**
     * Prefix of CSS variables used to store the color of the other theme.
     *
     * @default '--shiki-'
     */
    cssVariablePrefix?: string;
}
type CodeOptionsThemes<Themes extends string = string> = CodeOptionsSingleTheme<Themes> | CodeOptionsMultipleThemes<Themes>;
interface CodeOptionsMeta {
    meta?: Record<string, any>;
}
type CodeToHastOptions<Languages extends string = string, Themes extends string = string> = CodeToHastOptionsCommon<Languages> & CodeOptionsThemes<Themes> & CodeOptionsMeta;
interface ThemeRegistrationRaw extends IRawTheme {
}
interface ThemeRegistration extends ThemeRegistrationRaw {
    /**
     * @description theme name
     */
    name: string;
    /**
     * @description light/dark theme
     */
    type: 'light' | 'dark' | 'css';
    /**
     * @description tokenColors of the theme file
     */
    settings: any[];
    /**
     * @description text default foreground color
     */
    fg: string;
    /**
     * @description text default background color
     */
    bg: string;
    /**
     * @description relative path of included theme
     */
    include?: string;
    /**
     *
     * @description color map of the theme file
     */
    colors?: Record<string, string>;
}
interface HastTransformers {
    /**
     * Transform the entire generated HAST tree. Return a new Node will replace the original one.
     *
     * @param hast
     */
    root?: (hast: Root) => Root | void;
    pre?: (hast: Element) => Element | void;
    code?: (hast: Element) => Element | void;
    /**
     * Transform each line element.
     *
     * @param hast
     * @param line 1-based line number
     */
    line?: (hast: Element, line: number) => Element | void;
    token?: (hast: Element, line: number, col: number, lineElement: Element) => Element | void;
}
interface HtmlRendererOptionsCommon {
    lang?: string;
    langId?: string;
    fg?: string;
    bg?: string;
    /**
     * Hast transformers
     */
    transforms?: HastTransformers;
    themeName?: string;
    /**
     * Custom style string to be applied to the root `<pre>` element.
     * When specified, `fg` and `bg` will be ignored.
     */
    rootStyle?: string;
    /**
     * Merge token with only whitespace to the next token,
     * Saving a few extra `<span>`
     *
     * @default true
     */
    mergeWhitespaces?: boolean;
}
type HtmlRendererOptions = HtmlRendererOptionsCommon & CodeToHastOptions;
interface ThemedTokenScopeExplanation {
    scopeName: string;
    themeMatches: any[];
}
interface ThemedTokenExplanation {
    content: string;
    scopes: ThemedTokenScopeExplanation[];
}
/**
 * A single token with color, and optionally with explanation.
 *
 * For example:
 *
 * {
 *   "content": "shiki",
 *   "color": "#D8DEE9",
 *   "explanation": [
 *     {
 *       "content": "shiki",
 *       "scopes": [
 *         {
 *           "scopeName": "source.js",
 *           "themeMatches": []
 *         },
 *         {
 *           "scopeName": "meta.objectliteral.js",
 *           "themeMatches": []
 *         },
 *         {
 *           "scopeName": "meta.object.member.js",
 *           "themeMatches": []
 *         },
 *         {
 *           "scopeName": "meta.array.literal.js",
 *           "themeMatches": []
 *         },
 *         {
 *           "scopeName": "variable.other.object.js",
 *           "themeMatches": [
 *             {
 *               "name": "Variable",
 *               "scope": "variable.other",
 *               "settings": {
 *                 "foreground": "#D8DEE9"
 *               }
 *             },
 *             {
 *               "name": "[JavaScript] Variable Other Object",
 *               "scope": "source.js variable.other.object",
 *               "settings": {
 *                 "foreground": "#D8DEE9"
 *               }
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 */
interface ThemedToken {
    /**
     * The content of the token
     */
    content: string;
    /**
     * 6 or 8 digit hex code representation of the token's color
     */
    color?: string;
    /**
     * Override with custom inline style for HTML renderer.
     * When specified, `color` will be ignored.
     */
    htmlStyle?: string;
    /**
     * Font style of token. Can be None/Italic/Bold/Underline
     */
    fontStyle?: FontStyle;
    /**
     * Explanation of
     *
     * - token text's matching scopes
     * - reason that token text is given a color (one matching scope matches a rule (scope -> color) in the theme)
     */
    explanation?: ThemedTokenExplanation[];
}

export { type AnsiLanguage as A, type BuiltinLanguage as B, type CodeToHastOptions as C, type ThemedTokenScopeExplanation as D, type ThemedTokenExplanation as E, FontStyle as F, bundledThemes as G, type HighlighterGeneric as H, type IRawGrammar as I, bundledLanguagesBase as J, bundledLanguagesAlias as K, type LanguageInput as L, type MaybeGetter as M, bundledLanguages as N, type PlainTextLanguage as P, type Root as R, type SpecialLanguage as S, type ThemedToken as T, type BuiltinTheme as a, type RequireKeys as b, type CodeToThemedTokensOptions as c, type CodeToTokensWithThemesOptions as d, type IGrammar as e, type Awaitable as f, type MaybeModule as g, type MaybeArray as h, type ThemeInput as i, type StringLiteralUnion as j, type ResolveBundleKey as k, loadWasm as l, type ShikiContext as m, type HighlighterCoreOptions as n, type BundledHighlighterOptions as o, type LanguageRegistration as p, type CodeToHastOptionsCommon as q, type CodeOptionsSingleTheme as r, type CodeOptionsMultipleThemes as s, type CodeOptionsThemes as t, type CodeOptionsMeta as u, type ThemeRegistrationRaw as v, type ThemeRegistration as w, type HastTransformers as x, type HtmlRendererOptionsCommon as y, type HtmlRendererOptions as z };
