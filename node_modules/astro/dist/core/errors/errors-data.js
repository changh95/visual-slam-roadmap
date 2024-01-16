const UnknownCompilerError = {
  name: "UnknownCompilerError",
  title: "Unknown compiler error.",
  hint: "This is almost always a problem with the Astro compiler, not your code. Please open an issue at https://astro.build/issues/compiler."
};
const StaticRedirectNotAvailable = {
  name: "StaticRedirectNotAvailable",
  title: "`Astro.redirect` is not available in static mode.",
  message: "Redirects are only available when using `output: 'server'` or `output: 'hybrid'`. Update your Astro config if you need SSR features.",
  hint: "See https://docs.astro.build/en/guides/server-side-rendering/ for more information on how to enable SSR."
};
const ClientAddressNotAvailable = {
  name: "ClientAddressNotAvailable",
  title: "`Astro.clientAddress` is not available in current adapter.",
  message: (adapterName) => `\`Astro.clientAddress\` is not available in the \`${adapterName}\` adapter. File an issue with the adapter to add support.`
};
const StaticClientAddressNotAvailable = {
  name: "StaticClientAddressNotAvailable",
  title: "`Astro.clientAddress` is not available in static mode.",
  message: "`Astro.clientAddress` is only available when using `output: 'server'` or `output: 'hybrid'`. Update your Astro config if you need SSR features.",
  hint: "See https://docs.astro.build/en/guides/server-side-rendering/ for more information on how to enable SSR."
};
const NoMatchingStaticPathFound = {
  name: "NoMatchingStaticPathFound",
  title: "No static path found for requested path.",
  message: (pathName) => `A \`getStaticPaths()\` route pattern was matched, but no matching static path was found for requested path \`${pathName}\`.`,
  hint: (possibleRoutes) => `Possible dynamic routes being matched: ${possibleRoutes.join(", ")}.`
};
const OnlyResponseCanBeReturned = {
  name: "OnlyResponseCanBeReturned",
  title: "Invalid type returned by Astro page.",
  message: (route, returnedValue) => `Route \`${route ? route : ""}\` returned a \`${returnedValue}\`. Only a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) can be returned from Astro files.`,
  hint: "See https://docs.astro.build/en/guides/server-side-rendering/#response for more information."
};
const MissingMediaQueryDirective = {
  name: "MissingMediaQueryDirective",
  title: "Missing value for `client:media` directive.",
  message: 'Media query not provided for `client:media` directive. A media query similar to `client:media="(max-width: 600px)"` must be provided'
};
const NoMatchingRenderer = {
  name: "NoMatchingRenderer",
  title: "No matching renderer found.",
  message: (componentName, componentExtension, plural, validRenderersCount) => `Unable to render \`${componentName}\`.

${validRenderersCount > 0 ? `There ${plural ? "are" : "is"} ${validRenderersCount} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render \`${componentName}\`.` : `No valid renderer was found ${componentExtension ? `for the \`.${componentExtension}\` file extension.` : `for this file extension.`}`}`,
  hint: (probableRenderers) => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/core-concepts/framework-components/ for more information on how to install and configure integrations.`
};
const NoClientEntrypoint = {
  name: "NoClientEntrypoint",
  title: "No client entrypoint specified in renderer.",
  message: (componentName, clientDirective, rendererName) => `\`${componentName}\` component has a \`client:${clientDirective}\` directive, but no client entrypoint was provided by \`${rendererName}\`.`,
  hint: "See https://docs.astro.build/en/reference/integrations-reference/#addrenderer-option for more information on how to configure your renderer."
};
const NoClientOnlyHint = {
  name: "NoClientOnlyHint",
  title: "Missing hint on client:only directive.",
  message: (componentName) => `Unable to render \`${componentName}\`. When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
  hint: (probableRenderers) => `Did you mean to pass \`client:only="${probableRenderers}"\`? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`
};
const InvalidGetStaticPathParam = {
  name: "InvalidGetStaticPathParam",
  title: "Invalid value returned by a `getStaticPaths` path.",
  message: (paramType) => `Invalid params given to \`getStaticPaths\` path. Expected an \`object\`, got \`${paramType}\``,
  hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
};
const InvalidGetStaticPathsEntry = {
  name: "InvalidGetStaticPathsEntry",
  title: "Invalid entry inside getStaticPath's return value",
  message: (entryType) => `Invalid entry returned by getStaticPaths. Expected an object, got \`${entryType}\``,
  hint: "If you're using a `.map` call, you might be looking for `.flatMap()` instead. See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
};
const InvalidGetStaticPathsReturn = {
  name: "InvalidGetStaticPathsReturn",
  title: "Invalid value returned by getStaticPaths.",
  message: (returnType) => `Invalid type returned by \`getStaticPaths\`. Expected an \`array\`, got \`${returnType}\``,
  hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
};
const GetStaticPathsRemovedRSSHelper = {
  name: "GetStaticPathsRemovedRSSHelper",
  title: "getStaticPaths RSS helper is not available anymore.",
  message: "The RSS helper has been removed from `getStaticPaths`. Try the new @astrojs/rss package instead.",
  hint: "See https://docs.astro.build/en/guides/rss/ for more information."
};
const GetStaticPathsExpectedParams = {
  name: "GetStaticPathsExpectedParams",
  title: "Missing params property on `getStaticPaths` route.",
  message: "Missing or empty required `params` property on `getStaticPaths` route.",
  hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
};
const GetStaticPathsInvalidRouteParam = {
  name: "GetStaticPathsInvalidRouteParam",
  title: "Invalid value for `getStaticPaths` route parameter.",
  message: (key, value, valueType) => `Invalid getStaticPaths route parameter for \`${key}\`. Expected undefined, a string or a number, received \`${valueType}\` (\`${value}\`)`,
  hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
};
const GetStaticPathsRequired = {
  name: "GetStaticPathsRequired",
  title: "`getStaticPaths()` function required for dynamic routes.",
  message: "`getStaticPaths()` function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.",
  hint: `See https://docs.astro.build/en/core-concepts/routing/#dynamic-routes for more information on dynamic routes.

Alternatively, set \`output: "server"\` or \`output: "hybrid"\` in your Astro config file to switch to a non-static server build. This error can also occur if using \`export const prerender = true;\`.
See https://docs.astro.build/en/guides/server-side-rendering/ for more information on non-static rendering.`
};
const ReservedSlotName = {
  name: "ReservedSlotName",
  title: "Invalid slot name.",
  message: (slotName) => `Unable to create a slot named \`${slotName}\`. \`${slotName}\` is a reserved slot name. Please update the name of this slot.`
};
const NoAdapterInstalled = {
  name: "NoAdapterInstalled",
  title: "Cannot use Server-side Rendering without an adapter.",
  message: `Cannot use \`output: 'server'\` or \`output: 'hybrid'\` without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
  hint: "See https://docs.astro.build/en/guides/server-side-rendering/ for more information."
};
const NoMatchingImport = {
  name: "NoMatchingImport",
  title: "No import found for component.",
  message: (componentName) => `Could not render \`${componentName}\`. No matching import has been found for \`${componentName}\`.`,
  hint: "Please make sure the component is properly imported."
};
const InvalidPrerenderExport = {
  name: "InvalidPrerenderExport",
  title: "Invalid prerender export.",
  message(prefix, suffix, isHydridOuput) {
    const defaultExpectedValue = isHydridOuput ? "false" : "true";
    let msg = `A \`prerender\` export has been detected, but its value cannot be statically analyzed.`;
    if (prefix !== "const")
      msg += `
Expected \`const\` declaration but got \`${prefix}\`.`;
    if (suffix !== "true")
      msg += `
Expected \`${defaultExpectedValue}\` value but got \`${suffix}\`.`;
    return msg;
  },
  hint: "Mutable values declared at runtime are not supported. Please make sure to use exactly `export const prerender = true`."
};
const InvalidComponentArgs = {
  name: "InvalidComponentArgs",
  title: "Invalid component arguments.",
  message: (name) => `Invalid arguments passed to${name ? ` <${name}>` : ""} component.`,
  hint: "Astro components cannot be rendered directly via function call, such as `Component()` or `{items.map(Component)}`."
};
const PageNumberParamNotFound = {
  name: "PageNumberParamNotFound",
  title: "Page number param not found.",
  message: (paramName) => `[paginate()] page number param \`${paramName}\` not found in your filepath.`,
  hint: "Rename your file to `[page].astro` or `[...page].astro`."
};
const ImageMissingAlt = {
  name: "ImageMissingAlt",
  title: 'Image missing required "alt" property.',
  message: 'Image missing "alt" property. "alt" text is required to describe important images on the page.',
  hint: 'Use an empty string ("") for decorative images.'
};
const InvalidImageService = {
  name: "InvalidImageService",
  title: "Error while loading image service.",
  message: "There was an error loading the configured image service. Please see the stack trace for more information."
};
const MissingImageDimension = {
  name: "MissingImageDimension",
  title: "Missing image dimensions",
  message: (missingDimension, imageURL) => `Missing ${missingDimension === "both" ? "width and height attributes" : `${missingDimension} attribute`} for ${imageURL}. When using remote images, both dimensions are always required in order to avoid CLS.`,
  hint: "If your image is inside your `src` folder, you probably meant to import it instead. See [the Imports guide for more information](https://docs.astro.build/en/guides/imports/#other-assets)."
};
const UnsupportedImageFormat = {
  name: "UnsupportedImageFormat",
  title: "Unsupported image format",
  message: (format, imagePath, supportedFormats) => `Received unsupported format \`${format}\` from \`${imagePath}\`. Currently only ${supportedFormats.join(
    ", "
  )} are supported by our image services.`,
  hint: "Using an `img` tag directly instead of the `Image` component might be what you're looking for."
};
const UnsupportedImageConversion = {
  name: "UnsupportedImageConversion",
  title: "Unsupported image conversion",
  message: "Converting between vector (such as SVGs) and raster (such as PNGs and JPEGs) images is not currently supported."
};
const PrerenderDynamicEndpointPathCollide = {
  name: "PrerenderDynamicEndpointPathCollide",
  title: "Prerendered dynamic endpoint has path collision.",
  message: (pathname) => `Could not render \`${pathname}\` with an \`undefined\` param as the generated path will collide during prerendering. Prevent passing \`undefined\` as \`params\` for the endpoint's \`getStaticPaths()\` function, or add an additional extension to the endpoint's filename.`,
  hint: (filename) => `Rename \`${filename}\` to \`${filename.replace(/\.(js|ts)/, (m) => `.json` + m)}\``
};
const ExpectedImage = {
  name: "ExpectedImage",
  title: "Expected src to be an image.",
  message: (src, typeofOptions, fullOptions) => `Expected \`src\` property for \`getImage\` or \`<Image />\` to be either an ESM imported image or a string with the path of a remote image. Received \`${src}\` (type: \`${typeofOptions}\`).

Full serialized options received: \`${fullOptions}\`.`,
  hint: "This error can often happen because of a wrong path. Make sure the path to your image is correct. If you're passing an async function, make sure to call and await it."
};
const ExpectedImageOptions = {
  name: "ExpectedImageOptions",
  title: "Expected image options.",
  message: (options) => `Expected getImage() parameter to be an object. Received \`${options}\`.`
};
const IncompatibleDescriptorOptions = {
  name: "IncompatibleDescriptorOptions",
  title: "Cannot set both `densities` and `widths`",
  message: "Only one of `densities` or `widths` can be specified. In most cases, you'll probably want to use only `widths` if you require specific widths.",
  hint: "Those attributes are used to construct a `srcset` attribute, which cannot have both `x` and `w` descriptors."
};
const ImageNotFound = {
  name: "ImageNotFound",
  title: "Image not found.",
  message: (imagePath) => `Could not find requested image \`${imagePath}\`. Does it exist?`,
  hint: "This is often caused by a typo in the image path. Please make sure the file exists, and is spelled correctly."
};
const NoImageMetadata = {
  name: "NoImageMetadata",
  title: "Could not process image metadata.",
  message: (imagePath) => `Could not process image metadata${imagePath ? ` for \`${imagePath}\`` : ""}.`,
  hint: "This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue."
};
const MarkdownImageNotFound = {
  name: "MarkdownImageNotFound",
  title: "Image not found.",
  message: (imagePath, fullImagePath) => `Could not find requested image \`${imagePath}\`${fullImagePath ? ` at \`${fullImagePath}\`.` : "."}`,
  hint: "This is often caused by a typo in the image path. Please make sure the file exists, and is spelled correctly."
};
const CouldNotTransformImage = {
  name: "CouldNotTransformImage",
  title: "Could not transform image.",
  message: (imagePath) => `Could not transform image \`${imagePath}\`. See the stack trace for more information.`,
  hint: "This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue."
};
const ResponseSentError = {
  name: "ResponseSentError",
  title: "Unable to set response.",
  message: "The response has already been sent to the browser and cannot be altered."
};
const MiddlewareNoDataOrNextCalled = {
  name: "MiddlewareNoDataOrNextCalled",
  title: "The middleware didn't return a `Response`.",
  message: "Make sure your middleware returns a `Response` object, either directly or by returning the `Response` from calling the `next` function."
};
const MiddlewareNotAResponse = {
  name: "MiddlewareNotAResponse",
  title: "The middleware returned something that is not a `Response` object.",
  message: "Any data returned from middleware must be a valid `Response` object."
};
const LocalsNotAnObject = {
  name: "LocalsNotAnObject",
  title: "Value assigned to `locals` is not accepted.",
  message: "`locals` can only be assigned to an object. Other values like numbers, strings, etc. are not accepted.",
  hint: "If you tried to remove some information from the `locals` object, try to use `delete` or set the property to `undefined`."
};
const MiddlewareCantBeLoaded = {
  name: "MiddlewareCantBeLoaded",
  title: "Can't load the middleware.",
  message: "The middleware threw an error while Astro was trying to loading it."
};
const LocalImageUsedWrongly = {
  name: "LocalImageUsedWrongly",
  title: "Local images must be imported.",
  message: (imageFilePath) => `\`Image\`'s and \`getImage\`'s \`src\` parameter must be an imported image or an URL, it cannot be a string filepath. Received \`${imageFilePath}\`.`,
  hint: "If you want to use an image from your `src` folder, you need to either import it or if the image is coming from a content collection, use the [image() schema helper](https://docs.astro.build/en/guides/images/#images-in-content-collections) See https://docs.astro.build/en/guides/images/#src-required for more information on the `src` property."
};
const AstroGlobUsedOutside = {
  name: "AstroGlobUsedOutside",
  title: "Astro.glob() used outside of an Astro file.",
  message: (globStr) => `\`Astro.glob(${globStr})\` can only be used in \`.astro\` files. \`import.meta.glob(${globStr})\` can be used instead to achieve a similar result.`,
  hint: "See Vite's documentation on `import.meta.glob` for more information: https://vitejs.dev/guide/features.html#glob-import"
};
const AstroGlobNoMatch = {
  name: "AstroGlobNoMatch",
  title: "Astro.glob() did not match any files.",
  message: (globStr) => `\`Astro.glob(${globStr})\` did not return any matching files. Check the pattern for typos.`
};
const RedirectWithNoLocation = {
  name: "RedirectWithNoLocation",
  title: "A redirect must be given a location with the `Location` header."
};
const InvalidDynamicRoute = {
  name: "InvalidDynamicRoute",
  title: "Invalid dynamic route.",
  message: (route, invalidParam, received) => `The ${invalidParam} param for route ${route} is invalid. Received **${received}**.`
};
const MissingSharp = {
  name: "MissingSharp",
  title: "Could not find Sharp.",
  message: "Could not find Sharp. Please install Sharp (`sharp`) manually into your project or migrate to another image service.",
  hint: "See Sharp's installation instructions for more information: https://sharp.pixelplumbing.com/install. If you are not relying on `astro:assets` to optimize, transform, or process any images, you can configure a passthrough image service instead of installing Sharp. See https://docs.astro.build/en/reference/errors/missing-sharp for more information.\n\nSee https://docs.astro.build/en/guides/images/#default-image-service for more information on how to migrate to another image service."
};
const UnknownViteError = {
  name: "UnknownViteError",
  title: "Unknown Vite Error."
};
const FailedToLoadModuleSSR = {
  name: "FailedToLoadModuleSSR",
  title: "Could not import file.",
  message: (importName) => `Could not import \`${importName}\`.`,
  hint: "This is often caused by a typo in the import path. Please make sure the file exists."
};
const InvalidGlob = {
  name: "InvalidGlob",
  title: "Invalid glob pattern.",
  message: (globPattern) => `Invalid glob pattern: \`${globPattern}\`. Glob patterns must start with './', '../' or '/'.`,
  hint: "See https://docs.astro.build/en/guides/imports/#glob-patterns for more information on supported glob patterns."
};
const FailedToFindPageMapSSR = {
  name: "FailedToFindPageMapSSR",
  title: "Astro couldn't find the correct page to render",
  message: "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error. Please file an issue."
};
const MissingLocale = {
  name: "MissingLocaleError",
  title: "The provided locale does not exist.",
  message: (locale) => `The locale/path \`${locale}\` does not exist in the configured \`i18n.locales\`.`
};
const MissingIndexForInternationalization = {
  name: "MissingIndexForInternationalizationError",
  title: "Index page not found.",
  message: (src) => `Astro couldn't find the index URL. This index page is required to create a redirect from the index URL to the index URL of the default locale. 
Create an index page in \`${src}\``
};
const CantRenderPage = {
  name: "CantRenderPage",
  title: "Astro can't render the route.",
  message: "Astro cannot find any content to render for this route. There is no file or redirect associated with this route.",
  hint: "If you expect to find a route here, this may be an Astro bug. Please file an issue/restart the dev server"
};
const UnhandledRejection = {
  name: "UnhandledRejection",
  title: "Unhandled rejection",
  message: (stack) => `Astro detected an unhandled rejection. Here's the stack trace:
${stack}`,
  hint: "Make sure your promises all have an `await` or a `.catch()` handler."
};
const UnknownCSSError = {
  name: "UnknownCSSError",
  title: "Unknown CSS Error."
};
const CSSSyntaxError = {
  name: "CSSSyntaxError",
  title: "CSS Syntax Error."
};
const UnknownMarkdownError = {
  name: "UnknownMarkdownError",
  title: "Unknown Markdown Error."
};
const MarkdownFrontmatterParseError = {
  name: "MarkdownFrontmatterParseError",
  title: "Failed to parse Markdown frontmatter."
};
const InvalidFrontmatterInjectionError = {
  name: "InvalidFrontmatterInjectionError",
  title: "Invalid frontmatter injection.",
  message: 'A remark or rehype plugin attempted to inject invalid frontmatter. Ensure "astro.frontmatter" is set to a valid JSON object that is not `null` or `undefined`.',
  hint: "See the frontmatter injection docs https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically for more information."
};
const MdxIntegrationMissingError = {
  name: "MdxIntegrationMissingError",
  title: "MDX integration missing.",
  message: (file) => `Unable to render ${file}. Ensure that the \`@astrojs/mdx\` integration is installed.`,
  hint: "See the MDX integration docs for installation and usage instructions: https://docs.astro.build/en/guides/integrations-guide/mdx/"
};
const UnknownConfigError = {
  name: "UnknownConfigError",
  title: "Unknown configuration error."
};
const ConfigNotFound = {
  name: "ConfigNotFound",
  title: "Specified configuration file not found.",
  message: (configFile) => `Unable to resolve \`--config "${configFile}"\`. Does the file exist?`
};
const ConfigLegacyKey = {
  name: "ConfigLegacyKey",
  title: "Legacy configuration detected.",
  message: (legacyConfigKey) => `Legacy configuration detected: \`${legacyConfigKey}\`.`,
  hint: "Please update your configuration to the new format.\nSee https://astro.build/config for more information."
};
const UnknownCLIError = {
  name: "UnknownCLIError",
  title: "Unknown CLI Error."
};
const GenerateContentTypesError = {
  name: "GenerateContentTypesError",
  title: "Failed to generate content types.",
  message: (errorMessage) => `\`astro sync\` command failed to generate content collection types: ${errorMessage}`,
  hint: "Check your `src/content/config.*` file for typos."
};
const UnknownContentCollectionError = {
  name: "UnknownContentCollectionError",
  title: "Unknown Content Collection Error."
};
const InvalidContentEntryFrontmatterError = {
  name: "InvalidContentEntryFrontmatterError",
  title: "Content entry frontmatter does not match schema.",
  message(collection, entryId, error) {
    return [
      `**${String(collection)} \u2192 ${String(
        entryId
      )}** frontmatter does not match collection schema.`,
      ...error.errors.map((zodError) => zodError.message)
    ].join("\n");
  },
  hint: "See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas."
};
const InvalidContentEntrySlugError = {
  name: "InvalidContentEntrySlugError",
  title: "Invalid content entry slug.",
  message(collection, entryId) {
    return `${String(collection)} \u2192 ${String(
      entryId
    )} has an invalid slug. \`slug\` must be a string.`;
  },
  hint: "See https://docs.astro.build/en/guides/content-collections/ for more on the `slug` field."
};
const ContentSchemaContainsSlugError = {
  name: "ContentSchemaContainsSlugError",
  title: "Content Schema should not contain `slug`.",
  message: (collectionName) => `A content collection schema should not contain \`slug\` since it is reserved for slug generation. Remove this from your ${collectionName} collection schema.`,
  hint: "See https://docs.astro.build/en/guides/content-collections/ for more on the `slug` field."
};
const CollectionDoesNotExistError = {
  name: "CollectionDoesNotExistError",
  title: "Collection does not exist",
  message: (collectionName) => `The collection **${collectionName}** does not exist. Ensure a collection directory with this name exists.`,
  hint: "See https://docs.astro.build/en/guides/content-collections/ for more on creating collections."
};
const MixedContentDataCollectionError = {
  name: "MixedContentDataCollectionError",
  title: "Content and data cannot be in same collection.",
  message: (collectionName) => `**${collectionName}** contains a mix of content and data entries. All entries must be of the same type.`,
  hint: "Store data entries in a new collection separate from your content collection."
};
const ContentCollectionTypeMismatchError = {
  name: "ContentCollectionTypeMismatchError",
  title: "Collection contains entries of a different type.",
  message: (collection, expectedType, actualType) => `${collection} contains ${expectedType} entries, but is configured as a ${actualType} collection.`
};
const DataCollectionEntryParseError = {
  name: "DataCollectionEntryParseError",
  title: "Data collection entry failed to parse.",
  message(entryId, errorMessage) {
    return `**${entryId}** failed to parse: ${errorMessage}`;
  },
  hint: "Ensure your data entry is an object with valid JSON (for `.json` entries) or YAML (for `.yaml` entries)."
};
const DuplicateContentEntrySlugError = {
  name: "DuplicateContentEntrySlugError",
  title: "Duplicate content entry slug.",
  message(collection, slug, preExisting, alsoFound) {
    return `**${collection}** contains multiple entries with the same slug: \`${slug}\`. Slugs must be unique.

Entries: 
- ${preExisting}
- ${alsoFound}`;
  }
};
const UnsupportedConfigTransformError = {
  name: "UnsupportedConfigTransformError",
  title: "Unsupported transform in content config.",
  message: (parseError) => `\`transform()\` functions in your content config must return valid JSON, or data types compatible with the devalue library (including Dates, Maps, and Sets).
Full error: ${parseError}`,
  hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
};
const UnknownError = { name: "UnknownError", title: "Unknown Error." };
export {
  AstroGlobNoMatch,
  AstroGlobUsedOutside,
  CSSSyntaxError,
  CantRenderPage,
  ClientAddressNotAvailable,
  CollectionDoesNotExistError,
  ConfigLegacyKey,
  ConfigNotFound,
  ContentCollectionTypeMismatchError,
  ContentSchemaContainsSlugError,
  CouldNotTransformImage,
  DataCollectionEntryParseError,
  DuplicateContentEntrySlugError,
  ExpectedImage,
  ExpectedImageOptions,
  FailedToFindPageMapSSR,
  FailedToLoadModuleSSR,
  GenerateContentTypesError,
  GetStaticPathsExpectedParams,
  GetStaticPathsInvalidRouteParam,
  GetStaticPathsRemovedRSSHelper,
  GetStaticPathsRequired,
  ImageMissingAlt,
  ImageNotFound,
  IncompatibleDescriptorOptions,
  InvalidComponentArgs,
  InvalidContentEntryFrontmatterError,
  InvalidContentEntrySlugError,
  InvalidDynamicRoute,
  InvalidFrontmatterInjectionError,
  InvalidGetStaticPathParam,
  InvalidGetStaticPathsEntry,
  InvalidGetStaticPathsReturn,
  InvalidGlob,
  InvalidImageService,
  InvalidPrerenderExport,
  LocalImageUsedWrongly,
  LocalsNotAnObject,
  MarkdownFrontmatterParseError,
  MarkdownImageNotFound,
  MdxIntegrationMissingError,
  MiddlewareCantBeLoaded,
  MiddlewareNoDataOrNextCalled,
  MiddlewareNotAResponse,
  MissingImageDimension,
  MissingIndexForInternationalization,
  MissingLocale,
  MissingMediaQueryDirective,
  MissingSharp,
  MixedContentDataCollectionError,
  NoAdapterInstalled,
  NoClientEntrypoint,
  NoClientOnlyHint,
  NoImageMetadata,
  NoMatchingImport,
  NoMatchingRenderer,
  NoMatchingStaticPathFound,
  OnlyResponseCanBeReturned,
  PageNumberParamNotFound,
  PrerenderDynamicEndpointPathCollide,
  RedirectWithNoLocation,
  ReservedSlotName,
  ResponseSentError,
  StaticClientAddressNotAvailable,
  StaticRedirectNotAvailable,
  UnhandledRejection,
  UnknownCLIError,
  UnknownCSSError,
  UnknownCompilerError,
  UnknownConfigError,
  UnknownContentCollectionError,
  UnknownError,
  UnknownMarkdownError,
  UnknownViteError,
  UnsupportedConfigTransformError,
  UnsupportedImageConversion,
  UnsupportedImageFormat
};
