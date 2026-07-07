/** Site-wide tracking / verification IDs.
 * Empty string = the corresponding tag is omitted from the build.
 * After editing, push to main — the deploy Action rebuilds automatically. */
export const TRACKING = {
  // Google AdSense publisher ID (script included on every page)
  adsenseClient: 'ca-pub-5473245269912288',
  // Google Analytics 4 measurement ID, e.g. 'G-XXXXXXXXXX'
  gaMeasurementId: '',
  // Google Search Console <meta name="google-site-verification"> token
  googleSiteVerification: '',
  // Naver Search Advisor <meta name="naver-site-verification"> token
  naverSiteVerification: '',
  // Microsoft Clarity project ID (optional heatmaps/session replay)
  clarityId: '',
};
