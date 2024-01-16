import { parseUrl } from "./utils/parse-url.js";
function generateSitemap(pages, finalSiteUrl, opts) {
  const { changefreq, priority, lastmod: lastmodSrc, i18n } = opts;
  const urls = [...pages];
  urls.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const lastmod = lastmodSrc?.toISOString();
  const { locales, defaultLocale } = i18n || {};
  const localeCodes = Object.keys(locales || {});
  const getPath = (url) => {
    const result = parseUrl(url, i18n?.defaultLocale || "", localeCodes, finalSiteUrl);
    return result?.path;
  };
  const getLocale = (url) => {
    const result = parseUrl(url, i18n?.defaultLocale || "", localeCodes, finalSiteUrl);
    return result?.locale;
  };
  const urlData = urls.map((url) => {
    let links;
    if (defaultLocale && locales) {
      const currentPath = getPath(url);
      if (currentPath) {
        const filtered = urls.filter((subUrl) => getPath(subUrl) === currentPath);
        if (filtered.length > 1) {
          links = filtered.map((subUrl) => ({
            url: subUrl,
            lang: locales[getLocale(subUrl)]
          }));
        }
      }
    }
    return {
      url,
      links,
      lastmod,
      priority,
      changefreq
    };
  });
  return urlData;
}
export {
  generateSitemap
};
