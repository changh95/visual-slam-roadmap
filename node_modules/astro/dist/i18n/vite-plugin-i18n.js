const virtualModuleId = "astro:i18n";
const resolvedVirtualModuleId = "\0" + virtualModuleId;
function astroInternationalization({
  settings
}) {
  return {
    name: "astro:i18n",
    enforce: "pre",
    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
					import { 
						getLocaleRelativeUrl as _getLocaleRelativeUrl, 
						getLocaleRelativeUrlList as _getLocaleRelativeUrlList,
						getLocaleAbsoluteUrl as _getLocaleAbsoluteUrl, 
						getLocaleAbsoluteUrlList as _getLocaleAbsoluteUrlList,
						getPathByLocale as _getPathByLocale, 
						getLocaleByPath as _getLocaleByPath,
					} from "astro/virtual-modules/i18n.js";
					
					const base =  ${JSON.stringify(settings.config.base)};
					const trailingSlash =  ${JSON.stringify(settings.config.trailingSlash)};
					const format =  ${JSON.stringify(settings.config.build.format)};
					const site = ${JSON.stringify(settings.config.site)};
					const i18n = ${JSON.stringify(settings.config.i18n)};
					
					export const getRelativeLocaleUrl = (locale, path = "", opts) => _getLocaleRelativeUrl({ 
						locale,
						path, 
						base, 
						trailingSlash, 
						format,
						...i18n,
						...opts 
					});
					export const getAbsoluteLocaleUrl = (locale, path = "", opts) => _getLocaleAbsoluteUrl({ 
						locale, 
						path, 
						base, 
						trailingSlash, 
						format, 
						site, 
						...i18n,
						...opts 
					});
					
					export const getRelativeLocaleUrlList = (path = "", opts) => _getLocaleRelativeUrlList({ 
						base, path, trailingSlash, format, ...i18n, ...opts });
					export const getAbsoluteLocaleUrlList = (path = "", opts) => _getLocaleAbsoluteUrlList({ base, path, trailingSlash, format, site, ...i18n, ...opts });
					
					export const getPathByLocale = (locale) => _getPathByLocale(locale, i18n.locales);
					export const getLocaleByPath = (path) => _getLocaleByPath(path, i18n.locales);
				`;
      }
    }
  };
}
export {
  astroInternationalization as default
};
