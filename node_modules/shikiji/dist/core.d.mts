import { n as HighlighterCoreOptions, m as ShikiContext, H as HighlighterGeneric, o as BundledHighlighterOptions, L as LanguageInput, i as ThemeInput, C as CodeToHastOptions, R as Root, b as RequireKeys, c as CodeToThemedTokensOptions, T as ThemedToken, d as CodeToTokensWithThemesOptions, v as ThemeRegistrationRaw, w as ThemeRegistration } from './types/langs.mjs';
export { A as AnsiLanguage, f as Awaitable, B as BuiltinLanguage, a as BuiltinTheme, u as CodeOptionsMeta, s as CodeOptionsMultipleThemes, r as CodeOptionsSingleTheme, t as CodeOptionsThemes, q as CodeToHastOptionsCommon, F as FontStyle, x as HastTransformers, z as HtmlRendererOptions, y as HtmlRendererOptionsCommon, e as IGrammar, I as IRawGrammar, p as LanguageRegistration, h as MaybeArray, M as MaybeGetter, g as MaybeModule, P as PlainTextLanguage, k as ResolveBundleKey, S as SpecialLanguage, j as StringLiteralUnion, E as ThemedTokenExplanation, D as ThemedTokenScopeExplanation, l as loadWasm } from './types/langs.mjs';

/**
 * Get the minimal shiki context for rendering.
 */
declare function getShikiContext(options?: HighlighterCoreOptions): Promise<ShikiContext>;

type HighlighterCore = HighlighterGeneric<never, never>;
declare function getHighlighterCore(options?: HighlighterCoreOptions): Promise<HighlighterCore>;

type GetHighlighterFactory<L extends string, T extends string> = (options?: BundledHighlighterOptions<L, T>) => Promise<HighlighterGeneric<L, T>>;
/**
 * Create a `getHighlighter` function with bundled themes and languages.
 *
 * @param bundledLanguages
 * @param bundledThemes
 * @param ladWasm
 */
declare function createdBundledHighlighter<BundledLangs extends string, BundledThemes extends string>(bundledLanguages: Record<BundledLangs, LanguageInput>, bundledThemes: Record<BundledThemes, ThemeInput>, ladWasm: HighlighterCoreOptions['loadWasm']): GetHighlighterFactory<BundledLangs, BundledThemes>;
declare function createSingletonShorthands<L extends string, T extends string>(getHighlighter: GetHighlighterFactory<L, T>): {
    codeToHtml: (code: string, options: CodeToHastOptions<L, T>) => Promise<string>;
    codeToHast: (code: string, options: CodeToHastOptions<L, T>) => Promise<Root>;
    codeToThemedTokens: (code: string, options: RequireKeys<CodeToThemedTokensOptions<L, T>, 'theme' | 'lang'>) => Promise<ThemedToken[][]>;
    codeToTokensWithThemes: (code: string, options: RequireKeys<CodeToTokensWithThemesOptions<L, T>, 'themes' | 'lang'>) => Promise<[color: string, theme: string, tokens: ThemedToken[][]][]>;
};

declare function toShikiTheme(rawTheme: ThemeRegistrationRaw | ThemeRegistration): ThemeRegistration;

export { BundledHighlighterOptions, CodeToHastOptions, CodeToThemedTokensOptions, CodeToTokensWithThemesOptions, type GetHighlighterFactory, type HighlighterCore, HighlighterCoreOptions, HighlighterGeneric, LanguageInput, RequireKeys, ShikiContext, ThemeInput, ThemeRegistration, ThemeRegistrationRaw, ThemedToken, createSingletonShorthands, createdBundledHighlighter, getHighlighterCore, getShikiContext, toShikiTheme };
